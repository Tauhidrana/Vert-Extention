import { DEFAULT_LEARNING_CONTEXT, DEFAULT_POLICY, EMPTY_SESSION } from "../shared/defaults";
import { postSecureEvent } from "../shared/supabase";
import { storage } from "../shared/storage";
import type { FocusEvent, FocusPolicy, FocusSession, RuntimeMessage } from "../shared/types";
import { focusPageUrl, isAiBlockedByPolicy, isBlockedByPolicy, isLikelyLearningPage, isZvertsUrl } from "../shared/url";

const TIMER_ALARM = "zverts-focus-timer";
const REMINDER_ALARM = "zverts-study-reminder";

async function logEvent(event: Omit<FocusEvent, "id" | "at"> & { at?: number }) {
  await storage.addEvent(event);
  const events = await storage.getEvents();
  const settings = await storage.getSettings();
  const latest = events[0];
  if (latest) {
    postSecureEvent(settings, latest).catch(() => undefined);
  }
}

async function getState() {
  await syncFocusWithZvertsTabs();
  await requestActiveSessionFromZvertsTab();
  const [session, policy, learningContext, settings, events] = await Promise.all([
    storage.getSession(),
    storage.getPolicy(),
    storage.getLearningContext(),
    storage.getSettings(),
    storage.getEvents()
  ]);
  return { session, policy, learningContext, settings, events };
}

async function startFocus(input: Partial<FocusSession>) {
  const policy = await storage.getPolicy();
  const settings = await storage.getSettings();
  const existing = await storage.getSession();
  if (existing.active && existing.endsAt > Date.now() && input.durationMinutes === undefined) {
    const refreshed = {
      ...existing,
      sourceUrl: input.sourceUrl ?? existing.sourceUrl,
      zvertsTabId: input.zvertsTabId ?? existing.zvertsTabId
    };
    await storage.setSession(refreshed);
    await setAdRulesEnabled(true);
    return refreshed;
  }

  const durationMinutes = input.durationMinutes ?? settings.pomodoroMinutes ?? policy.defaultTimerMinutes;
  const now = Date.now();
  const session: FocusSession = {
    ...EMPTY_SESSION,
    active: true,
    startedAt: now,
    endsAt: now + durationMinutes * 60_000,
    durationMinutes,
    sourceUrl: input.sourceUrl,
    zvertsTabId: input.zvertsTabId
  };

  await storage.setSession(session);
  await setAdRulesEnabled(true);
  await chrome.alarms.create(TIMER_ALARM, { when: session.endsAt });
  await chrome.alarms.create(REMINDER_ALARM, { delayInMinutes: Math.max(1, settings.studyReminderMinutes) });
  await logEvent({ type: "focus_started", url: input.sourceUrl, details: { durationMinutes } });
  return session;
}

async function endFocus(reason = "manual") {
  const previous = await storage.getSession();
  const preserveStoppedTab = reason === "timer_complete" || reason === "user_disabled";
  await storage.setSession({
    ...EMPTY_SESSION,
    startedAt: preserveStoppedTab ? Date.now() : 0,
    sourceUrl: preserveStoppedTab ? previous.sourceUrl : undefined,
    zvertsTabId: preserveStoppedTab ? previous.zvertsTabId : undefined
  });
  await setAdRulesEnabled(false);
  await chrome.alarms.clear(TIMER_ALARM);
  await chrome.alarms.clear(REMINDER_ALARM);
  if (reason === "zverts_tab_closed" || reason === "auto_start_disabled") {
    await storage.setLearningContext(DEFAULT_LEARNING_CONTEXT);
  }
  await logEvent({
    type: reason === "unexpected" ? "unexpected_end" : "focus_ended",
    url: previous.sourceUrl,
    details: { reason, interruptionCount: previous.interruptionCount }
  });
}

async function redirectBlockedTab(tabId: number, url: string, reason = "blocked_navigation") {
  const session = await storage.getSession();
  await storage.setSession({
    ...session,
    interruptionCount: session.interruptionCount + 1,
    distractionAttempts: session.distractionAttempts + 1,
    blockedRequests: session.blockedRequests + 1
  });
  await logEvent({ type: reason === "external_escape" ? "external_escape_blocked" : "blocked_navigation", url });
  await chrome.tabs.update(tabId, { url: focusPageUrl(url, reason) });
}

async function maybeBlockNavigation(tabId: number, url?: string) {
  if (!url || url.startsWith(chrome.runtime.getURL(""))) return;
  const [session, policy, settings] = await Promise.all([storage.getSession(), storage.getPolicy(), storage.getSettings()]);
  if (!session.active) return;

  try {
    if (session.quizMode && isAiBlockedByPolicy(url, policy.aiBlockedSites)) {
      await redirectBlockedTab(tabId, url, "ai_tool_blocked");
      await handleQuizEvent({ type: "QUIZ_EVENT", event: "ai_tool", url, details: { violation: "ai_tool_blocked" } });
      return;
    }

    if (isBlockedByPolicy(url, policy.blockedSites, settings.whitelist)) {
      await redirectBlockedTab(tabId, url);
    }
  } catch {
  }
}

async function handleQuizEvent(event: Extract<RuntimeMessage, { type: "QUIZ_EVENT" }>) {
  const [session, policy] = await Promise.all([storage.getSession(), storage.getPolicy()]);
  if (!session.active || !session.quizMode) return session;

  const isSwitch = event.event === "switch" || event.event === "blur" || event.event === "hidden";
  const fullscreenExit = event.event === "fullscreen_exit";
  const isViolation = event.event !== "focus";
  const quizSwitches = isSwitch ? session.quizSwitches + 1 : session.quizSwitches;
  const fullscreenExits = fullscreenExit ? session.fullscreenExits + 1 : session.fullscreenExits;
  const quizViolations = isViolation ? session.quizViolations + 1 : session.quizViolations;
  const quizPaused = session.quizPaused || fullscreenExit || event.event === "devtools";
  const next = { ...session, quizSwitches, fullscreenExits, quizViolations, quizPaused };
  await storage.setSession(next);

  const eventType = quizEventToFocusEvent(event.event);
  if (eventType) {
    await logEvent({
      type: eventType,
      url: event.url,
      details: { ...event.details, quizSwitches, fullscreenExits, quizViolations, limit: policy.quizWarningLimit }
    });
  }

  await notifyZvertsQuizEvent({
    event: event.event,
    url: event.url,
    details: event.details,
    warningCount: quizViolations,
    tabSwitches: quizSwitches,
    fullscreenExits
  });

  if (quizViolations >= policy.quizWarningLimit) {
    await logEvent({ type: "quiz_locked", url: event.url, details: { action: policy.quizAction } });
    await notifyZvertsQuizEvent({ event: "quiz_locked", details: { action: policy.quizAction, warningCount: quizViolations } });
    notify("Quiz Protected", policy.quizAction === "submit" ? "Quiz auto-submit requested." : "Quiz locked after repeated focus exits.");
  }
  return next;
}

function quizEventToFocusEvent(event: Extract<RuntimeMessage, { type: "QUIZ_EVENT" }>["event"]): FocusEvent["type"] | null {
  switch (event) {
    case "fullscreen_exit": return "fullscreen_exit";
    case "right_click": return "right_click_blocked";
    case "shortcut": return "shortcut_blocked";
    case "clipboard": return "clipboard_blocked";
    case "devtools": return "devtools_attempt";
    case "ai_tool": return "ai_tool_blocked";
    case "screenshot": return "screenshot_attempt";
    case "multi_monitor": return "multi_monitor_warning";
    case "switch":
    case "blur":
    case "hidden": return "quiz_warning";
    default: return null;
  }
}

async function enableQuizMode(message: Extract<RuntimeMessage, { type: "QUIZ_STARTED" }>) {
  const [session, policy] = await Promise.all([storage.getSession(), storage.getPolicy()]);
  const nextPolicy = { ...policy, ...message.config, messages: { ...policy.messages, ...message.config?.messages } };
  await storage.setPolicy(nextPolicy);
  const nextSession = session.active ? { ...session, quizMode: true, quizPaused: false, quizSessionId: message.quizSessionId, quizSwitches: 0, fullscreenExits: 0, quizViolations: 0 } : await startFocus({});
  await storage.setSession({ ...nextSession, quizMode: true, quizPaused: false, quizSessionId: message.quizSessionId });
  await logEvent({ type: "quiz_started", url: nextSession.sourceUrl });
  await notifyZvertsQuizEvent({ event: "quiz_started", details: { quizSessionId: message.quizSessionId } });
  return nextSession;
}

async function endQuizMode(reason = "quiz_end") {
  const session = await storage.getSession();
  await storage.setSession({ ...session, quizMode: false, quizPaused: false, quizSessionId: undefined });
  await logEvent({ type: "quiz_ended", url: session.sourceUrl, details: { reason } });
  await notifyZvertsQuizEvent({ event: "quiz_ended", details: { reason } });
}

function notify(title: string, message: string) {
  storage.getSettings().then((settings) => {
    if (!settings.notificationsEnabled) return;
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title,
      message
    });
  });
}

async function setAdRulesEnabled(enabled: boolean) {
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabled ? ["static_ads"] : [],
    disableRulesetIds: enabled ? [] : ["static_ads"]
  });
}

async function findZvertsTab() {
  const tabs = await chrome.tabs.query({});
  return tabs.find((tab) => isZvertsUrl(tab.url));
}

async function syncFocusWithZvertsTabs() {
  const [settings, session] = await Promise.all([storage.getSettings(), storage.getSession()]);
  const zvertsTab = await findZvertsTab();

  if (!settings.autoStartFocus) {
    if (session.active) await endFocus("auto_start_disabled");
    return;
  }

  if (zvertsTab?.id && zvertsTab.url) {
    const stoppedForSameTab = !session.active && session.zvertsTabId === zvertsTab.id && session.startedAt > 0;
    if (stoppedForSameTab) {
      await setAdRulesEnabled(false);
      return;
    }

    if (!session.active || session.endsAt <= Date.now()) {
      await logEvent({ type: "zverts_detected", url: zvertsTab.url });
      await startFocus({ sourceUrl: zvertsTab.url, zvertsTabId: zvertsTab.id });
      await requestActiveSessionFromZvertsTab(zvertsTab.id);
    } else if (session.zvertsTabId !== zvertsTab.id || session.sourceUrl !== zvertsTab.url) {
      await storage.setSession({ ...session, sourceUrl: zvertsTab.url, zvertsTabId: zvertsTab.id });
      await setAdRulesEnabled(true);
      await requestActiveSessionFromZvertsTab(zvertsTab.id);
    }
    return;
  }

  if (session.active) {
    await logEvent({ type: "zverts_closed", url: session.sourceUrl });
    await endFocus("zverts_tab_closed");
  } else {
    await setAdRulesEnabled(false);
  }
}

async function requestActiveSessionFromZvertsTab(tabId?: number) {
  const targetTabId = tabId ?? (await findZvertsTab())?.id;
  if (!targetTabId) return;
  await chrome.tabs.sendMessage(targetTabId, { type: "REQUEST_LEARNING_SESSION_SYNC" }).catch(() => undefined);
}

async function notifyZvertsQuizEvent(payload: Record<string, unknown>) {
  const session = await storage.getSession();
  const targetTabId = session.zvertsTabId ?? (await findZvertsTab())?.id;
  if (!targetTabId) return;
  await chrome.tabs.sendMessage(targetTabId, { type: "QUIZ_EVENT_FROM_EXTENSION", payload }).catch(() => undefined);
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await storage.setPolicy({ ...DEFAULT_POLICY, ...state.policy, messages: { ...DEFAULT_POLICY.messages, ...state.policy.messages } });
});

chrome.runtime.onStartup.addListener(async () => {
  await syncFocusWithZvertsTabs();
  const session = await storage.getSession();
  if (!session.active) return;
  if (session.endsAt <= Date.now()) {
    await endFocus("timer_expired_during_shutdown");
    return;
  }
  await chrome.alarms.create(TIMER_ALARM, { when: session.endsAt });
  const settings = await storage.getSettings();
  await chrome.alarms.create(REMINDER_ALARM, { delayInMinutes: Math.max(1, settings.studyReminderMinutes) });
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case "START_FOCUS":
        sendResponse({ ok: true, state: await startFocus(message) });
        break;
      case "END_FOCUS":
        await endFocus(message.reason);
        sendResponse({ ok: true, state: await getState() });
        break;
      case "GET_STATE":
        sendResponse({ ok: true, state: await getState() });
        break;
      case "REQUEST_LEARNING_SESSION_SYNC":
        await requestActiveSessionFromZvertsTab(sender.tab?.id);
        sendResponse({ ok: true });
        break;
      case "OPEN_FOCUS_PAGE":
        if (sender.tab?.id) await redirectBlockedTab(sender.tab.id, message.url ?? sender.tab.url ?? "", "external_escape");
        sendResponse({ ok: true });
        break;
      case "QUIZ_STARTED":
        sendResponse({ ok: true, state: await enableQuizMode(message) });
        break;
      case "QUIZ_ENDED":
        await endQuizMode(message.reason);
        sendResponse({ ok: true, state: await getState() });
        break;
      case "QUIZ_EVENT":
        sendResponse({ ok: true, state: await handleQuizEvent(message) });
        break;
      case "LEARNING_CONTEXT": {
        const context = await storage.getLearningContext();
        const nextContext = message.context.active === false
          ? { ...DEFAULT_LEARNING_CONTEXT, updatedAt: Date.now() }
          : { ...context, ...message.context, active: true, updatedAt: Date.now() };
        await storage.setLearningContext(nextContext);
        sendResponse({ ok: true });
        break;
      }
      case "NOTIFY":
        notify(message.title, message.message);
        sendResponse({ ok: true });
        break;
      case "SAVE_SETTINGS": {
        const settings = await storage.getSettings();
        await storage.setSettings({ ...settings, ...message.settings });
        sendResponse({ ok: true });
        break;
      }
      case "ADMIN_POLICY": {
        const policy = await storage.getPolicy();
        await storage.setPolicy({ ...policy, ...message.policy, messages: { ...policy.messages, ...message.policy.messages } });
        sendResponse({ ok: true });
        break;
      }
      case "QUIZ_EVENT_FROM_EXTENSION":
        sendResponse({ ok: true });
        break;
    }
  })().catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    syncFocusWithZvertsTabs().catch(() => undefined);
  }

  if (changeInfo.status === "loading") {
    maybeBlockNavigation(tabId, changeInfo.url ?? tab.url);
  }

  const url = changeInfo.url ?? tab.url;
  if (url && isLikelyLearningPage(url)) {
    startFocus({ sourceUrl: url, zvertsTabId: tabId }).catch(() => undefined);
  }
});

chrome.tabs.onRemoved.addListener(() => {
  syncFocusWithZvertsTabs().catch(() => undefined);
});

chrome.tabs.onActivated.addListener(() => {
  syncFocusWithZvertsTabs().catch(() => undefined);
  handleQuizEvent({ type: "QUIZ_EVENT", event: "switch", details: { source: "tabs.onActivated" } }).catch(() => undefined);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    handleQuizEvent({ type: "QUIZ_EVENT", event: "blur", details: { source: "windows.onFocusChanged" } }).catch(() => undefined);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    maybeBlockNavigation(details.tabId, details.url);
  }
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0 || !isZvertsUrl(details.url)) return;
  await syncFocusWithZvertsTabs();
  if (isLikelyLearningPage(details.url)) await startFocus({ sourceUrl: details.url, zvertsTabId: details.tabId });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TIMER_ALARM) {
    notify("Focus session complete", "Nice work. Your ZverTs study timer is finished.");
    await endFocus("timer_complete");
  }

  if (alarm.name === REMINDER_ALARM) {
    const session = await storage.getSession();
    if (!session.active) return;
    notify("Continue your lesson", "Your streak is waiting.");
    await logEvent({ type: "idle_reminder", url: session.sourceUrl });
    const settings = await storage.getSettings();
    await chrome.alarms.create(REMINDER_ALARM, { delayInMinutes: Math.max(1, settings.studyReminderMinutes) });
  }
});
