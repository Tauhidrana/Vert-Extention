import type { LearningContext, RuntimeMessage } from "../shared/types";

const send = <T extends RuntimeMessage>(message: T) => chrome.runtime.sendMessage(message).catch(() => undefined);
const QUIZ_FLAG = "zvertsQuizMode";
const QUIZ_PAUSED_FLAG = "zvertsQuizPaused";

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "messenger.com",
  "threads.net",
  "x.com",
  "twitter.com",
  "reddit.com",
  "discord.com",
  "linkedin.com",
  "tiktok.com",
  "web.whatsapp.com",
  "netflix.com",
  "primevideo.com",
  "youtube.com"
];

function isSocialEscape(href: string) {
  try {
    const url = new URL(href, location.href);
    const host = url.hostname.replace(/^www\./, "");
    return SOCIAL_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isLearningPage() {
  const path = location.pathname.toLowerCase();
  return ["/learn", "/course", "/lesson", "/watch", "/module", "/quiz"].some((part) => path.includes(part));
}

function startFocusIfNeeded() {
  send({ type: "START_FOCUS", sourceUrl: location.href });
  requestActiveLearningSession();
}

function protectExternalLinks() {
  document.addEventListener(
    "click",
    (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || !isSocialEscape(anchor.href)) return;
      event.preventDefault();
      event.stopPropagation();
      send({ type: "OPEN_FOCUS_PAGE", url: anchor.href, reason: "external_social_link" });
    },
    true
  );
}

function installQuizShield() {
  const blockedEvents = ["contextmenu", "copy", "paste", "cut", "dragstart", "dragover", "drop", "selectstart", "mousedown", "mouseup"];
  blockedEvents.forEach((name) => {
    document.addEventListener(
      name,
      (event) => {
        if (!isQuizMode()) return;
        if (name === "mousedown" || name === "mouseup") {
          const mouseEvent = event as MouseEvent;
          if (mouseEvent.button !== 2) return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (name === "contextmenu" || name === "mousedown" || name === "mouseup") {
          reportQuizViolation("right_click", { event: name });
        } else if (["copy", "paste", "cut"].includes(name)) {
          reportQuizViolation("clipboard", { event: name });
        }
      },
      true
    );
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (!isQuizMode()) return;
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const blockedCtrlKeys = ["a", "c", "v", "x", "p", "s", "u", "j", "l", "t", "n", "w", "r", "tab"];
      const blocked =
        (ctrl && blockedCtrlKeys.includes(key)) ||
        (ctrl && event.shiftKey && ["i", "j", "c", "n", "r", "escape", "esc", "tab"].includes(key)) ||
        (event.altKey && key === "tab") ||
        key === "f12" ||
        key === "printscreen";

      if (blocked) {
        event.preventDefault();
        event.stopPropagation();
        if (key === "f12" || (ctrl && event.shiftKey && ["i", "j", "c"].includes(key)) || (ctrl && key === "u")) {
          pauseQuiz("Developer tools attempt detected.");
          reportQuizViolation("devtools", { key: event.key, ctrl, shift: event.shiftKey, alt: event.altKey });
        } else if (key === "printscreen") {
          reportQuizViolation("screenshot", { key: event.key });
        } else {
          reportQuizViolation("shortcut", { key: event.key, ctrl, shift: event.shiftKey, alt: event.altKey });
        }
      }
    },
    true
  );

  document.addEventListener("keyup", (event) => {
    if (isQuizMode() && event.key.toLowerCase() === "printscreen") {
      reportQuizViolation("screenshot", { key: event.key, phase: "keyup" });
    }
  }, true);
}

function showQuizBanner(message = "Quiz Protected") {
  if (document.getElementById("zverts-quiz-banner")) return;
  const banner = document.createElement("div");
  banner.id = "zverts-quiz-banner";
  banner.textContent = `${message} - Do not switch tabs during the examination.`;
  banner.style.cssText = [
    "position:fixed",
    "top:16px",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:2147483647",
    "padding:12px 18px",
    "border-radius:14px",
    "background:rgba(18,24,33,.94)",
    "border:1px solid rgba(74,222,128,.45)",
    "box-shadow:0 20px 60px rgba(0,0,0,.45)",
    "color:#fff",
    "font:600 13px Inter,system-ui,sans-serif"
  ].join(";");
  document.documentElement.appendChild(banner);
}

function showPauseOverlay(message = "Return to fullscreen to continue.") {
  let overlay = document.getElementById("zverts-quiz-pause");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "zverts-quiz-pause";
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:grid",
      "place-items:center",
      "background:rgba(11,15,20,.96)",
      "color:#fff",
      "font:600 16px Inter,system-ui,sans-serif",
      "text-align:center",
      "padding:24px"
    ].join(";");
    overlay.innerHTML = `<div style="max-width:420px"><div style="font-size:28px;font-weight:900;margin-bottom:12px">Quiz Paused</div><p style="color:rgba(255,255,255,.68);line-height:1.6">${message}</p><button id="zverts-return-fullscreen" style="margin-top:18px;border:0;border-radius:10px;background:#4ADE80;color:#0B0F14;padding:12px 18px;font-weight:800;cursor:pointer">Return to fullscreen</button></div>`;
    document.documentElement.appendChild(overlay);
    document.getElementById("zverts-return-fullscreen")?.addEventListener("click", () => {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    });
  }
  overlay.style.display = "grid";
}

function hidePauseOverlay() {
  const overlay = document.getElementById("zverts-quiz-pause");
  if (overlay) overlay.style.display = "none";
}

function isQuizMode() {
  return document.documentElement.dataset[QUIZ_FLAG] === "true";
}

function reportToWebsite(type: string, payload: Record<string, unknown> = {}) {
  window.postMessage({ type, payload }, location.origin);
  window.dispatchEvent(new CustomEvent(type.toLowerCase().replaceAll("_", "-"), { detail: payload }));
}

function reportQuizViolation(event: Extract<RuntimeMessage, { type: "QUIZ_EVENT" }>["event"], details: Record<string, unknown> = {}) {
  send({ type: "QUIZ_EVENT", event, url: location.href, details });
  reportToWebsite("ZVERTS_FOCUS_QUIZ_EVENT", { event, url: location.href, details });
}

function pauseQuiz(message: string) {
  document.documentElement.dataset[QUIZ_PAUSED_FLAG] = "true";
  showPauseOverlay(message);
  reportToWebsite("ZVERTS_FOCUS_QUIZ_PAUSED", { message, url: location.href });
}

function enterQuizMode(config?: Record<string, unknown>, quizSessionId?: string) {
  if (!location.pathname.toLowerCase().includes("quiz") && !document.querySelector("[data-zverts-quiz], [data-quiz-active], .zverts-quiz")) return;
  document.documentElement.dataset[QUIZ_FLAG] = "true";
  document.documentElement.dataset[QUIZ_PAUSED_FLAG] = "false";
  document.documentElement.style.userSelect = "none";
  showQuizBanner();
  send({ type: "QUIZ_STARTED", quizSessionId, config });
  reportToWebsite("ZVERTS_FOCUS_QUIZ_STARTED", { quizSessionId, url: location.href });
  document.documentElement.requestFullscreen?.().catch(() => {
    pauseQuiz("Fullscreen is required before starting the quiz.");
  });
  detectMultipleMonitors();
}

function exitQuizMode(reason = "quiz_end") {
  delete document.documentElement.dataset[QUIZ_FLAG];
  delete document.documentElement.dataset[QUIZ_PAUSED_FLAG];
  document.documentElement.style.userSelect = "";
  hidePauseOverlay();
  send({ type: "QUIZ_ENDED", reason });
  reportToWebsite("ZVERTS_FOCUS_QUIZ_ENDED", { reason, url: location.href });
  document.exitFullscreen?.().catch(() => undefined);
}

function detectQuizStart() {
  const hasQuizSignal = Boolean(document.querySelector("[data-zverts-quiz], [data-quiz-active], .zverts-quiz"));
  if (hasQuizSignal) enterQuizMode();

  const observer = new MutationObserver(() => {
    if (!document.documentElement.dataset.zvertsQuizMode && document.querySelector("[data-zverts-quiz], [data-quiz-active], .zverts-quiz")) {
      enterQuizMode();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === "ZVERTS_QUIZ_START" || event.data?.type === "QUIZ_START") {
      enterQuizMode(event.data.config, event.data.quizSessionId ?? event.data.sessionId);
    }
    if (event.data?.type === "ZVERTS_QUIZ_END" || event.data?.type === "QUIZ_END") {
      exitQuizMode(event.data.reason ?? "website_quiz_end");
    }
  });
}

function monitorFocus() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && isQuizMode()) reportQuizViolation("hidden", { source: "visibilitychange" });
  });
  window.addEventListener("blur", () => {
    if (isQuizMode()) reportQuizViolation("blur", { source: "window.blur" });
  });
  window.addEventListener("focus", () => {
    if (isQuizMode()) send({ type: "QUIZ_EVENT", event: "focus", url: location.href });
  });
  document.addEventListener("fullscreenchange", () => {
    if (isQuizMode() && !document.fullscreenElement) {
      pauseQuiz("Return to fullscreen to continue.");
      reportQuizViolation("fullscreen_exit", { source: "fullscreenchange" });
    } else if (isQuizMode() && document.fullscreenElement) {
      document.documentElement.dataset[QUIZ_PAUSED_FLAG] = "false";
      hidePauseOverlay();
    }
  });
}

function detectDevtoolsOpen() {
  if (!isQuizMode()) return;
  const threshold = 160;
  const widthOpen = window.outerWidth - window.innerWidth > threshold;
  const heightOpen = window.outerHeight - window.innerHeight > threshold;
  if (widthOpen || heightOpen) {
    pauseQuiz("Developer tools attempt detected.");
    reportQuizViolation("devtools", { source: "viewport_heuristic", widthOpen, heightOpen });
  }
}

async function detectMultipleMonitors() {
  try {
    const getScreenDetails = (window as unknown as { getScreenDetails?: () => Promise<{ screens?: unknown[] }> }).getScreenDetails;
    if (!getScreenDetails) return;
    const details = await getScreenDetails.call(window);
    if ((details.screens?.length ?? 1) > 1) {
      reportQuizViolation("multi_monitor", { screens: details.screens?.length });
    }
  } catch {
  }
}

function listenForZvertsAppEvents() {
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    if (
      event.data?.type === "ZVERTS_PROGRESS_UPDATE" ||
      event.data?.type === "ZVERTS_LEARNING_CONTEXT" ||
      event.data?.type === "ZVERTS_ACTIVE_LEARNING_SESSION"
    ) {
      const context = normalizeLearningSession(event.data.context ?? event.data.session ?? event.data.progress ?? {});
      send({ type: "LEARNING_CONTEXT", context });
    }
    if (event.data?.type === "ZVERTS_NOTIFICATION") {
      send({ type: "NOTIFY", title: event.data.title, message: event.data.message });
    }
    if (event.data?.type === "ZVERTS_FOCUS_POLICY") {
      send({ type: "ADMIN_POLICY", policy: event.data.policy ?? {} });
    }
  });
}

function numberOrUndefined(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function minutesFromDuration(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  if (typeof value !== "string") return undefined;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return undefined;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + Math.round(parts[2] / 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return numberOrUndefined(value);
}

function normalizeLearningSession(rawInput: unknown): Partial<LearningContext> {
  if (!rawInput || typeof rawInput !== "object") {
    return { active: false, completionPercent: 0 };
  }

  const raw = rawInput as Record<string, unknown>;
  const session = (raw.session ?? raw.activeSession ?? raw.learningSession ?? raw) as Record<string, unknown>;
  const course = (session.course ?? raw.course ?? {}) as Record<string, unknown>;
  const module = (session.module ?? session.currentModule ?? raw.module ?? {}) as Record<string, unknown>;
  const lesson = (session.lesson ?? session.currentLesson ?? raw.lesson ?? {}) as Record<string, unknown>;
  const progress = (session.progress ?? raw.progress ?? {}) as Record<string, unknown>;
  const mission = (session.dailyMission ?? raw.dailyMission ?? raw.mission ?? {}) as Record<string, unknown>;
  const user = (session.userStats ?? raw.userStats ?? raw.user ?? {}) as Record<string, unknown>;
  const sessionId = String(session.id ?? session.sessionId ?? raw.sessionId ?? "");

  if (!sessionId && !session.courseId && !course.name && !lesson.name) {
    return { active: false, completionPercent: 0 };
  }

  return {
    active: true,
    sessionId: sessionId || undefined,
    currentCourseName: String(course.name ?? session.courseName ?? raw.currentCourseName ?? ""),
    currentModuleName: String(module.name ?? session.moduleName ?? raw.currentModuleName ?? ""),
    currentLessonName: String(lesson.name ?? session.lessonName ?? raw.currentLessonName ?? ""),
    currentLessonNumber: numberOrUndefined(lesson.number ?? session.lessonNumber ?? raw.currentLessonNumber),
    courseThumbnail: String(course.thumbnail ?? course.thumbnailUrl ?? session.courseThumbnail ?? raw.courseThumbnail ?? ""),
    currentTask: (session.currentTask ?? raw.currentTask) as LearningContext["currentTask"],
    completionPercent: numberOrUndefined(progress.completionPercent ?? session.completionPercent ?? raw.completionPercent) ?? 0,
    lessonsCompleted: numberOrUndefined(progress.lessonsCompleted ?? session.lessonsCompleted ?? raw.lessonsCompleted),
    totalLessons: numberOrUndefined(progress.totalLessons ?? session.totalLessons ?? raw.totalLessons),
    watchTimeMinutes: minutesFromDuration(progress.watchTime ?? session.watchTime ?? raw.watchTime ?? session.watchTimeMinutes),
    remainingTimeMinutes: minutesFromDuration(progress.remainingTime ?? session.remainingTime ?? raw.remainingTime ?? session.remainingTimeMinutes),
    dailyMissionProgress: numberOrUndefined(mission.progress ?? session.dailyMissionProgress ?? raw.dailyMissionProgress),
    xp: numberOrUndefined(user.xp ?? session.xp ?? raw.xp),
    gems: numberOrUndefined(user.gems ?? session.gems ?? raw.gems),
    streak: numberOrUndefined(user.streak ?? session.streak ?? raw.streak)
  };
}

async function fetchActiveLearningSession() {
  const endpoints = [
    "/api/learning/session/active",
    "/api/learning-sessions/active",
    "/api/learning/active-session",
    "/api/focus/session",
    "/api/me/learning-session"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(new URL(endpoint, location.origin), {
        credentials: "include",
        headers: { accept: "application/json" }
      });
      if (response.status === 401 || response.status === 403) return { active: false, completionPercent: 0 };
      if (!response.ok) continue;
      const data = (await response.json()) as Record<string, unknown>;
      return normalizeLearningSession(data);
    } catch {
      continue;
    }
  }

  return null;
}

let syncTimer: number | undefined;

async function requestActiveLearningSession() {
  window.postMessage({ type: "ZVERTS_FOCUS_EXTENSION_READY" }, location.origin);
  window.postMessage({ type: "ZVERTS_FOCUS_REQUEST_SESSION" }, location.origin);
  window.dispatchEvent(new CustomEvent("zverts-focus:request-session"));

  const context = await fetchActiveLearningSession();
  if (context) send({ type: "LEARNING_CONTEXT", context });
}

function scheduleSessionSync() {
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(requestActiveLearningSession, 350);
}

installQuizShield();
protectExternalLinks();
monitorFocus();
listenForZvertsAppEvents();

chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
  if (message.type === "REQUEST_LEARNING_SESSION_SYNC") {
    requestActiveLearningSession();
  }
  if (message.type === "QUIZ_EVENT_FROM_EXTENSION") {
    reportToWebsite("ZVERTS_FOCUS_QUIZ_EVENT", message.payload as Record<string, unknown>);
  }
});

window.addEventListener("focus", scheduleSessionSync);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleSessionSync();
});

const pushState = history.pushState;
history.pushState = function patchedPushState(...args) {
  const result = pushState.apply(this, args);
  scheduleSessionSync();
  return result;
};
window.addEventListener("popstate", scheduleSessionSync);
new MutationObserver(scheduleSessionSync).observe(document.documentElement, { childList: true, subtree: true });
window.setInterval(requestActiveLearningSession, 10_000);
window.setInterval(detectDevtoolsOpen, 1_000);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    startFocusIfNeeded();
    detectQuizStart();
  });
} else {
  startFocusIfNeeded();
  detectQuizStart();
}
