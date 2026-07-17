import "../styles/global.css";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  Clock3,
  Gem,
  Flame,
  Sparkles,
  ShieldCheck,
  Shield,
  Settings,
  Zap,
  Trophy
} from "lucide-react";
import { Card, CardHeader, Divider, GhostButton, Logo, ProgressBar, Stat, StatusDot } from "../shared/ui";
import type { FocusEvent, FocusPolicy, FocusSession, LearningContext, UserSettings } from "../shared/types";

interface State {
  session: FocusSession;
  policy: FocusPolicy;
  learningContext: LearningContext;
  settings: UserSettings;
  events: FocusEvent[];
}

function formatRemaining(endsAt: number, active: boolean) {
  if (!active) return "--:--";
  const remaining = Math.max(0, endsAt - Date.now());
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function timerProgress(session: FocusSession) {
  if (!session.active || !session.startedAt || !session.endsAt) return 0;
  const total = session.endsAt - session.startedAt;
  const elapsed = Date.now() - session.startedAt;
  return Math.max(0, Math.min(1, elapsed / total));
}

function formatMinutes(minutes?: number) {
  if (minutes === undefined) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
}

function TimerRing({ value, time }: { value: number; time: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  return (
    <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeLinecap="round"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          filter="drop-shadow(0 0 16px rgba(74,222,128,0.5))"
        />
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#B8FF2C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Remaining</div>
        <div className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white">{time}</div>
        <div className="text-[10px] font-medium text-zgreen/80">minutes</div>
      </div>
    </div>
  );
}

function ProtectionBadge({ label, active, icon: Icon }: { label: string; active: boolean; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 transition-all duration-200 hover:bg-white/[0.05]">
      <div className={cn("grid h-8 w-8 place-items-center rounded-lg", active ? "bg-zgreen/15 text-zgreen" : "bg-white/[0.06] text-white/30")}>
        <Icon size={15} />
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold text-white/70">{label}</div>
      </div>
      <StatusDot active={active} />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function Popup() {
  const [state, setState] = useState<State | null>(null);
  const [, tick] = useState(0);

  const load = () => chrome.runtime.sendMessage({ type: "GET_STATE" }).then((response) => setState(response.state));
  useEffect(() => {
    load();
    chrome.runtime.sendMessage({ type: "REQUEST_LEARNING_SESSION_SYNC" });
    const timer = window.setInterval(() => tick((v) => v + 1), 1000);
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "local" && (changes.learningContext || changes.focusSession)) load();
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      window.clearInterval(timer);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const remaining = useMemo(() => (state ? formatRemaining(state.session.endsAt, state.session.active) : "--:--"), [state, state?.session.endsAt]);
  const progress = state ? timerProgress(state.session) : 0;

  if (!state) {
    return (
      <div className="grid h-[560px] w-[390px] place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zgreen/30 border-t-zgreen" />
          <div className="text-sm text-white/50">Loading...</div>
        </div>
      </div>
    );
  }

  const { session, learningContext } = state;
  const hasActiveSession = learningContext.active && Boolean(learningContext.sessionId || learningContext.currentCourseName);

  return (
    <main className="w-[390px] animate-fade-in p-4">
      <header className="mb-5 flex items-center justify-between">
        <Logo />
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition-all duration-200 hover:border-zgreen/40 hover:bg-zgreen/10 hover:text-zgreen"
          title="Settings"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings size={17} />
        </button>
      </header>

      <Card className="mb-4 overflow-hidden p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zgreen/80">Focus Protection</div>
            <div className="mt-1.5 flex items-center gap-2.5">
              <StatusDot active={session.active} />
              <span className="text-sm font-bold text-white">{session.active ? "ACTIVE" : "IDLE"}</span>
            </div>
          </div>
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-zgreen/10 text-zgreen shadow-glowSoft">
            <ShieldCheck size={22} />
          </div>
        </div>

        {session.active ? (
          <TimerRing value={progress} time={remaining} />
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-white/[0.04]">
              <Shield size={24} className="text-white/25" />
            </div>
            <h2 className="m-0 text-lg font-bold text-white">Protection is idle</h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-white/45">
              Open ZverTs to automatically start Focus Mode
            </p>
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader icon={Zap} title="Session Stats" />
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label="Sites Protected" value={session.blockedRequests} accent />
          <Stat label="Blocked" value={session.distractionAttempts} />
          <Stat label="Duration" value={`${session.durationMinutes || state.settings.pomodoroMinutes}m`} />
          <Stat label="Interruptions" value={session.interruptionCount} />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader icon={BookOpen} title="Current Course" />
        {hasActiveSession ? (
          <>
            <div className="flex gap-3.5">
              {learningContext.courseThumbnail && (
                <img
                  src={learningContext.courseThumbnail}
                  alt=""
                  className="h-16 w-24 rounded-xl border border-white/[0.08] object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{learningContext.currentCourseName}</div>
                <div className="mt-1 truncate text-xs text-white/50">{learningContext.currentModuleName}</div>
                {learningContext.currentLessonName && (
                  <div className="mt-0.5 truncate text-xs text-white/50">
                    Lesson {learningContext.currentLessonNumber ?? ""} — {learningContext.currentLessonName}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={learningContext.completionPercent} />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="font-medium text-white/45">
                {learningContext.lessonsCompleted ?? 0} / {learningContext.totalLessons ?? 0} lessons
              </span>
              <span className="font-bold text-zgreen">{Math.round(learningContext.completionPercent)}%</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Watch Time" value={formatMinutes(learningContext.watchTimeMinutes)} />
              <Stat label="Remaining" value={formatMinutes(learningContext.remainingTimeMinutes)} />
            </div>
          </>
        ) : (
          <p className="m-0 text-sm leading-relaxed text-white/45">
            Start a course on ZverTs to begin
          </p>
        )}
      </Card>

      {hasActiveSession && (
        <Card className="mb-4">
          <CardHeader icon={Trophy} title="Rewards" />
          <div className="grid grid-cols-3 gap-2.5">
            <Stat label="XP" value={learningContext.xp ?? 0} accent />
            <Stat label="Gems" value={
              <span className="inline-flex items-center gap-1">
                <Gem size={14} className="text-blue-400" /> {learningContext.gems ?? 0}
              </span>
            } />
            <Stat label="Streak" value={
              <span className="inline-flex items-center gap-1">
                <Flame size={14} className="text-orange-400" /> {learningContext.streak ?? 0}
              </span>
            } />
          </div>
          {learningContext.dailyMissionProgress !== undefined && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-white/50">
                  <Sparkles size={12} className="text-zgreen" /> Daily Mission
                </span>
                <span className="font-bold text-zgreen">{Math.round(learningContext.dailyMissionProgress)}%</span>
              </div>
              <ProgressBar value={learningContext.dailyMissionProgress} size="sm" />
            </div>
          )}
        </Card>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <ProtectionBadge label="Ad Blocker" active={session.active} icon={Shield} />
        <ProtectionBadge label="Social Shield" active={session.active} icon={ShieldCheck} />
        <ProtectionBadge label="Tab Guard" active={session.active} icon={Shield} />
        <ProtectionBadge label="Quiz Lock" active={session.quizMode} icon={ShieldCheck} />
      </div>

      <footer className="flex items-center justify-between px-1 text-[11px] text-white/35">
        <span>Notifications {state.settings.notificationsEnabled ? "on" : "off"}</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-zgreen/60" />
          ZverTs connected
        </span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
