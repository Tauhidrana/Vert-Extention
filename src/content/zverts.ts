import type { RuntimeMessage } from "../shared/types";

const send = <T extends RuntimeMessage>(message: T) => chrome.runtime.sendMessage(message).catch(() => undefined);

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

function detectMetadata() {
  const course =
    document.querySelector<HTMLMetaElement>('meta[name="zverts:course"]')?.content ||
    document.querySelector<HTMLElement>("[data-zverts-course]")?.dataset.zvertsCourse ||
    undefined;
  const lesson =
    document.querySelector<HTMLMetaElement>('meta[name="zverts:lesson"]')?.content ||
    document.querySelector<HTMLElement>("[data-zverts-lesson]")?.dataset.zvertsLesson ||
    document.title;

  return { course, lesson };
}

function startFocusIfNeeded() {
  if (!isLearningPage()) return;
  const { course, lesson } = detectMetadata();
  send({ type: "START_FOCUS", sourceUrl: location.href, currentCourse: course, currentLesson: lesson });
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
  const blockedEvents = ["contextmenu", "copy", "paste", "cut", "dragstart", "selectstart"];
  blockedEvents.forEach((name) => {
    document.addEventListener(
      name,
      (event) => {
        if (!document.documentElement.dataset.zvertsQuizMode) return;
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (!document.documentElement.dataset.zvertsQuizMode) return;
      const key = event.key.toLowerCase();
      const blocked =
        (event.ctrlKey || event.metaKey) &&
        ["c", "v", "x", "p", "s", "u", "i", "j"].includes(key);
      const devToolsCombo = key === "f12" || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key));
      if (blocked || devToolsCombo) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
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

function enterQuizMode(config?: Record<string, unknown>) {
  document.documentElement.dataset.zvertsQuizMode = "true";
  document.documentElement.style.userSelect = "none";
  showQuizBanner();
  send({ type: "QUIZ_STARTED", config });
  document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function detectQuizStart() {
  const hasQuizSignal =
    location.pathname.toLowerCase().includes("quiz") ||
    Boolean(document.querySelector("[data-zverts-quiz], [data-quiz-active], .zverts-quiz"));
  if (hasQuizSignal) enterQuizMode();

  const observer = new MutationObserver(() => {
    if (!document.documentElement.dataset.zvertsQuizMode && document.querySelector("[data-zverts-quiz], [data-quiz-active], .zverts-quiz")) {
      enterQuizMode();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "ZVERTS_QUIZ_START") return;
    enterQuizMode(event.data.config);
  });
}

function monitorFocus() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) send({ type: "QUIZ_EVENT", event: "hidden", url: location.href });
  });
  window.addEventListener("blur", () => send({ type: "QUIZ_EVENT", event: "blur", url: location.href }));
  window.addEventListener("focus", () => send({ type: "QUIZ_EVENT", event: "focus", url: location.href }));
  document.addEventListener("fullscreenchange", () => {
    if (document.documentElement.dataset.zvertsQuizMode && !document.fullscreenElement) {
      showQuizBanner("Fullscreen required");
      send({ type: "QUIZ_EVENT", event: "fullscreen_exit", url: location.href });
    }
  });
}

function listenForZvertsAppEvents() {
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === "ZVERTS_PROGRESS_UPDATE") {
      send({ type: "PROGRESS_UPDATE", progress: event.data.progress ?? {} });
    }
    if (event.data?.type === "ZVERTS_NOTIFICATION") {
      send({ type: "NOTIFY", title: event.data.title, message: event.data.message });
    }
    if (event.data?.type === "ZVERTS_FOCUS_POLICY") {
      send({ type: "ADMIN_POLICY", policy: event.data.policy ?? {} });
    }
  });
}

installQuizShield();
protectExternalLinks();
monitorFocus();
listenForZvertsAppEvents();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    startFocusIfNeeded();
    detectQuizStart();
  });
} else {
  startFocusIfNeeded();
  detectQuizStart();
}
