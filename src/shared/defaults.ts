import type { FocusPolicy, FocusSession, UserProgress, UserSettings } from "./types";

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
    "youtube.com"
  ],
  socialPathBlocks: ["linkedin.com/feed"],
  youtubeAllowedReferrers: ["zverts.com"],
  quizWarningLimit: 3,
  quizAction: "lock",
  defaultTimerMinutes: 45,
  messages: {
    focusTitle: "Stay Focused",
    focusBody: "You're currently in a ZverTs learning session. Finish your study session before visiting social media.",
    quizProtected: "Quiz Protected"
  }
};

export const EMPTY_SESSION: FocusSession = {
  active: false,
  startedAt: 0,
  endsAt: 0,
  durationMinutes: 0,
  quizMode: false,
  quizSwitches: 0,
  fullscreenExits: 0,
  interruptionCount: 0
};

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 1280,
  gems: 36,
  level: 7,
  streak: 5,
  todaysGoalMinutes: 60,
  studiedTodayMinutes: 20,
  course: "ZverTs Academy",
  module: "Current Module",
  completionPercent: 42,
  watchTimeMinutes: 82,
  remainingLessons: 6
};

export const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  pomodoroMinutes: 45,
  studyReminderMinutes: 5,
  whitelist: ["zverts.com"],
  theme: "dark"
};
