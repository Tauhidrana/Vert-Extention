import "../styles/global.css";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, BookOpen, CircleSlash, Clock3, LockKeyhole, Settings, Shield, ShieldCheck, Wifi } from "lucide-react";
import { Card, GhostButton, Logo, ProgressBar, Stat } from "../shared/ui";
import type { FocusEvent, FocusPolicy, FocusSession, LearningContext, UserSettings } from "../shared/types";

interface State {
  session: FocusSession;
  policy: FocusPolicy;
  learningContext: LearningContext;
  settings: UserSettings;
  events: FocusEvent[];
}

function formatRemaining(endsAt: number, active: boolean) {
  if (!active) return "25:00";
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

function StatusBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
      <span className="text-[11px] font-semibold text-white/65">{label}</span>
      <span className={on ? "text-[11px] font-black text-zgreen" : "text-[11px] font-black text-white/35"}>{on ? "ON" : "OFF"}</span>
    </div>
  );
}

function TimerRing({ value, label }: { value: number; label: string }) {
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);
  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#4ADE80"
          strokeLinecap="round"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
          filter="drop-shadow(0 0 12px rgba(74,222,128,.55))"
        />
      </svg>
      <div className="text-center">
        <div className="text-[11px] font-bold uppercase text-white/45">Remaining Focus Time</div>
        <div className="mt-1 text-4xl font-black tracking-normal text-white">{label}</div>
      </div>
    </div>
  );
}

function Popup() {
  const [state, setState] = useState<State | null>(null);
  const [, tick] = useState(0);

  const load = () => chrome.runtime.sendMessage({ type: "GET_STATE" }).then((response) => setState(response.state));
  useEffect(() => {
    load();
    const timer = window.setInterval(() => tick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => (state ? formatRemaining(state.session.endsAt, state.session.active) : "25:00"), [state, state?.session.endsAt]);
  const progress = state ? timerProgress(state.session) : 0;

  if (!state) return <div className="grid h-[560px] w-[390px] place-items-center text-sm text-white/70">Loading ZverTs Focus...</div>;

  const { session, policy, learningContext } = state;
  const hasCourse = Boolean(learningContext.currentCourse || learningContext.currentModule || learningContext.updatedAt);

  return (
    <main className="w-[390px] p-4">
      <header className="mb-4 flex items-center justify-between">
        <Logo />
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition hover:border-zgreen/40 hover:text-zgreen"
          title="Open settings"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings size={18} />
        </button>
      </header>

      <Card className="mb-3 overflow-hidden p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase text-zgreen">Focus Protection</div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
              <span className={session.active ? "h-2.5 w-2.5 rounded-full bg-zgreen shadow-glow" : "h-2.5 w-2.5 rounded-full bg-white/25"} />
              {session.active ? "ACTIVE" : "IDLE"}
            </div>
          </div>
          <ShieldCheck className={session.active ? "text-zgreen" : "text-white/30"} size={28} />
        </div>

        {session.active ? (
          <TimerRing value={progress} label={remaining} />
        ) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-center">
            <CircleSlash className="mx-auto text-white/35" size={34} />
            <h1 className="m-0 mt-3 text-xl font-black text-white">Protection is idle</h1>
            <p className="m-0 mt-2 text-sm leading-6 text-white/55">Open ZverTs to automatically enable Focus Mode. Your normal browsing stays untouched.</p>
          </div>
        )}
      </Card>

      <Card className="mb-3">
        <div className="mb-3 flex items-center gap-2">
          <Shield size={18} className="text-zgreen" />
          <div className="text-sm font-black">Current Status</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Protected Websites" value={policy.blockedSites.length} />
          <Stat label="Blocked Requests" value={session.blockedRequests} />
          <Stat label="Focus Session" value={`${session.durationMinutes || state.settings.pomodoroMinutes} min`} />
          <Stat label="Distraction Prevented" value={session.distractionAttempts} />
        </div>
      </Card>

      <Card className="mb-3">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-zgreen" />
          <div className="text-sm font-black">Current Course</div>
        </div>
        {hasCourse ? (
          <>
            <div className="text-sm font-bold text-white">{learningContext.currentCourse ?? "ZverTs Course"}</div>
            <div className="mt-1 text-xs text-white/55">
              {learningContext.currentModule ??
                (learningContext.moduleIndex && learningContext.moduleTotal ? `Module ${learningContext.moduleIndex} / ${learningContext.moduleTotal}` : "Module in progress")}
            </div>
            <div className="mt-3"><ProgressBar value={learningContext.completionPercent} /></div>
            <div className="mt-2 text-right text-xs font-bold text-zgreen">{Math.round(learningContext.completionPercent)}%</div>
          </>
        ) : (
          <p className="m-0 text-sm leading-6 text-white/55">Waiting for course data from ZverTs.</p>
        )}
      </Card>

      <Card className="mb-3">
        <div className="mb-3 flex items-center gap-2">
          <Clock3 size={18} className="text-zgreen" />
          <div className="text-sm font-black">Today's Learning</div>
        </div>
        <div className="rounded-lg border border-zgreen/25 bg-zgreen/10 px-3 py-3 text-sm font-bold text-white">
          {learningContext.currentTask ?? "Waiting for ZverTs task"}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <StatusBadge label="Ads Blocker" on={session.active} />
        <StatusBadge label="Social Protection" on={session.active} />
        <StatusBadge label="Tab Protection" on={session.active} />
        <StatusBadge label="Quiz Lock" on={session.quizMode} />
      </div>

      <footer className="mt-3 flex items-center justify-between text-xs text-white/45">
        <span className="inline-flex items-center gap-1"><Bell size={13} /> Notifications {state.settings.notificationsEnabled ? "on" : "off"}</span>
        <span className="inline-flex items-center gap-1"><Wifi size={13} /> ZverTs link</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
