import type { FocusPolicy, FocusSession, LearningContext, UserSettings } from "./types";
import { AI_BLOCKED_SITES } from "./ai-blocklist";

export const ZVERTS_ORIGINS = ["https://www.zverts.com", "https://zverts.com"];

export const DEFAULT_POLICY: FocusPolicy = {
  blockedSites: [
    "facebook.com",
    "instagram.com",
    "messenger.com",
    "threads.net",
    "x.com",
    "twitter.com",
    "reddit.com",
    "discord.com",
    "linkedin.com/feed",
    "tiktok.com",
    "web.whatsapp.com",
    "netflix.com",
    "primevideo.com",
    "youtube.com",
    "youtube.com/feed",
    "youtube.com/shorts"
  ],
  aiBlockedSites: AI_BLOCKED_SITES,
  socialPathBlocks: ["linkedin.com/feed"],
  youtubeAllowedReferrers: ["zverts.com"],
  quizWarningLimit: 3,
  quizAction: "lock",
  defaultTimerMinutes: 25,
  messages: {
    focusTitle: "Stay Focused",
    focusBody: "You're currently learning on ZverTs. Finish your lesson first.",
    quizProtected: "Quiz Protected"
  }
};

export const EMPTY_SESSION: FocusSession = {
  active: false,
  startedAt: 0,
  endsAt: 0,
  durationMinutes: 0,
  youtubeBlockTime: 0,
  quizMode: false,
  quizPaused: false,
  quizSwitches: 0,
  fullscreenExits: 0,
  quizViolations: 0,
  interruptionCount: 0,
  blockedRequests: 0,
  distractionAttempts: 0
};

export const DEFAULT_LEARNING_CONTEXT: LearningContext = {
  active: false,
  completionPercent: 0
};

export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  autoStartFocus: true,
  pomodoroMinutes: 25,
  studyReminderMinutes: 5,
  whitelist: ["zverts.com"],
  theme: "dark"
};
