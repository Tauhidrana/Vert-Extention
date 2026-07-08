export type TimerPreset = 25 | 45 | 60 | 90 | "custom";

export type QuizAction = "lock" | "submit";

export interface FocusPolicy {
  blockedSites: string[];
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
  currentLesson?: string;
  currentCourse?: string;
  quizMode: boolean;
  quizSwitches: number;
  fullscreenExits: number;
  interruptionCount: number;
}

export interface UserProgress {
  xp: number;
  gems: number;
  level: number;
  streak: number;
  todaysGoalMinutes: number;
  studiedTodayMinutes: number;
  course: string;
  module: string;
  completionPercent: number;
  watchTimeMinutes: number;
  remainingLessons: number;
}

export interface UserSettings {
  notificationsEnabled: boolean;
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
    | "quiz_warning"
    | "quiz_locked"
    | "fullscreen_exit"
    | "idle_reminder"
    | "unexpected_end";
  at: number;
  url?: string;
  details?: Record<string, unknown>;
}

export type RuntimeMessage =
  | { type: "START_FOCUS"; durationMinutes?: number; sourceUrl?: string; currentLesson?: string; currentCourse?: string }
  | { type: "END_FOCUS"; reason?: string }
  | { type: "GET_STATE" }
  | { type: "OPEN_FOCUS_PAGE"; url?: string; reason?: string }
  | { type: "QUIZ_STARTED"; config?: Partial<FocusPolicy> }
  | { type: "QUIZ_EVENT"; event: "switch" | "blur" | "hidden" | "fullscreen_exit" | "focus"; url?: string }
  | { type: "PROGRESS_UPDATE"; progress: Partial<UserProgress> }
  | { type: "NOTIFY"; title: string; message: string }
  | { type: "SAVE_SETTINGS"; settings: Partial<UserSettings> }
  | { type: "ADMIN_POLICY"; policy: Partial<FocusPolicy> };
