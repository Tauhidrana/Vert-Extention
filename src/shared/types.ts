export type TimerPreset = 25 | 45 | 60 | 90 | "custom";

export type QuizAction = "lock" | "submit";

export interface FocusPolicy {
  blockedSites: string[];
  aiBlockedSites: string[];
  socialPathBlocks: string[];
  youtubeAllowedReferrers: string[];
  quizWarningLimit: number;
  quizAction: QuizAction;
  defaultTimerMinutes: number;
  messages: {
    focusTitle: string;
    focusBody: string;
    quizProtected: string;
  };
}

export interface FocusSession {
  active: boolean;
  startedAt: number;
  endsAt: number;
  durationMinutes: number;
  sourceUrl?: string;
  quizMode: boolean;
  quizPaused: boolean;
  quizSessionId?: string;
  quizSwitches: number;
  fullscreenExits: number;
  quizViolations: number;
  interruptionCount: number;
  blockedRequests: number;
  distractionAttempts: number;
  zvertsTabId?: number;
}

export interface LearningContext {
  active: boolean;
  sessionId?: string;
  currentCourseName?: string;
  currentModuleName?: string;
  currentLessonName?: string;
  currentLessonNumber?: number;
  courseThumbnail?: string;
  currentTask?: "Watch Module" | "Quiz" | "Revision" | "Learning";
  completionPercent: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  watchTimeMinutes?: number;
  remainingTimeMinutes?: number;
  dailyMissionProgress?: number;
  xp?: number;
  gems?: number;
  streak?: number;
  updatedAt?: number;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  autoStartFocus: boolean;
  pomodoroMinutes: number;
  studyReminderMinutes: number;
  whitelist: string[];
  theme: "dark" | "system";
  supabaseUrl?: string;
  jwt?: string;
}

export interface FocusEvent {
  id: string;
  type:
    | "focus_started"
    | "focus_ended"
    | "blocked_navigation"
    | "external_escape_blocked"
    | "quiz_started"
    | "quiz_ended"
    | "quiz_warning"
    | "quiz_locked"
    | "quiz_paused"
    | "ai_tool_blocked"
    | "right_click_blocked"
    | "shortcut_blocked"
    | "clipboard_blocked"
    | "devtools_attempt"
    | "screenshot_attempt"
    | "multi_monitor_warning"
    | "fullscreen_exit"
    | "idle_reminder"
    | "unexpected_end"
    | "zverts_detected"
    | "zverts_closed";
  at: number;
  url?: string;
  details?: Record<string, unknown>;
}

export type RuntimeMessage =
  | { type: "START_FOCUS"; durationMinutes?: number; sourceUrl?: string; zvertsTabId?: number }
  | { type: "END_FOCUS"; reason?: string }
  | { type: "GET_STATE" }
  | { type: "OPEN_FOCUS_PAGE"; url?: string; reason?: string }
  | { type: "QUIZ_STARTED"; quizSessionId?: string; config?: Partial<FocusPolicy> }
  | { type: "QUIZ_ENDED"; reason?: string }
  | { type: "QUIZ_EVENT"; event: "switch" | "blur" | "hidden" | "fullscreen_exit" | "focus" | "right_click" | "shortcut" | "clipboard" | "devtools" | "screenshot" | "multi_monitor" | "ai_tool"; url?: string; details?: Record<string, unknown> }
  | { type: "QUIZ_EVENT_FROM_EXTENSION"; payload: Record<string, unknown> }
  | { type: "LEARNING_CONTEXT"; context: Partial<LearningContext> }
  | { type: "REQUEST_LEARNING_SESSION_SYNC" }
  | { type: "NOTIFY"; title: string; message: string }
  | { type: "SAVE_SETTINGS"; settings: Partial<UserSettings> }
  | { type: "ADMIN_POLICY"; policy: Partial<FocusPolicy> };
