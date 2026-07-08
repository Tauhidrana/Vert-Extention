import "../styles/global.css";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, BookOpen, Clock, Flame, Gem, Play, Settings, ShieldCheck, Square } from "lucide-react";
import { Button, Card, GhostButton, Logo, ProgressBar, Stat } from "../shared/ui";
import type { FocusEvent, FocusPolicy, FocusSession, UserProgress, UserSettings } from "../shared/types";

interface State {
  session: FocusSession;
  policy: FocusPolicy;
  progress: UserProgress;
  settings: UserSettings;
  events: FocusEvent[];
}

function formatRemaining(endsAt: number, active: boolean) {
  if (!active) return "00:00";
  const remaining = Math.max(0, endsAt - Date.now());
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

  const remaining = useMemo(() => (state ? formatRemaining(state.session.endsAt, state.session.active) : "00:00"), [state, state?.session.endsAt]);

  if (!state) return <div className="grid h-[560px] w-[380px] place-items-center text-sm text-white/70">Loading ZverTs Focus...</div>;

  const start = (minutes = state.settings.pomodoroMinutes) =>
    chrome.runtime.sendMessage({ type: "START_FOCUS", durationMinutes: minutes }).then(load);
  const end = () => {
    const ok = window.confirm("Ending Focus Mode will be saved as an interruption for this study session.");
    if (!ok) return;
    chrome.runtime.sendMessage({ type: "END_FOCUS", reason: "user_disabled" }).then(load);
  };

  return (
    <main className="w-[390px] p-4">
      <header className="mb-4 flex items-center justify-between">
        <Logo />
        <button
          className="focus-ring grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/80"
          title="Open settings"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings size={18} />
        </button>
      </header>

      <Card className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-normal text-zgreen">Remaining Time</p>
            <h1 className="m-0 mt-1 text-4xl font-black tracking-normal">{remaining}</h1>
            <p className="m-0 mt-1 text-sm text-white/60">
              {state.session.active ? state.session.currentLesson ?? "ZverTs learning session active" : "Ready for your next session"}
            </p>
          </div>
          <div className="rounded-lg border border-zgreen/30 bg-zgreen/10 p-3 text-zgreen">
            <ShieldCheck size={24} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {state.session.active ? (
            <GhostButton onClick={end} className="col-span-2">
              <Square size={16} /> End Focus
            </GhostButton>
          ) : (
            <>
              <Button onClick={() => start(25)}>
                <Play size={16} /> 25 min
              </Button>
              <Button onClick={() => start(45)}>
                <Clock size={16} /> 45 min
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card className="mb-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold">Today's Mission</div>
            <div className="text-xs text-white/55">{state.progress.studiedTodayMinutes} of {state.progress.todaysGoalMinutes} minutes</div>
          </div>
          <Flame className="text-zhighlight" size={20} />
        </div>
        <ProgressBar value={(state.progress.studiedTodayMinutes / state.progress.todaysGoalMinutes) * 100} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="XP" value={state.progress.xp} />
          <Stat label="Gems" value={state.progress.gems} />
          <Stat label="Streak" value={`${state.progress.streak}d`} />
        </div>
      </Card>

      <Card className="mb-3">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-zgreen" />
          <div className="text-sm font-bold">Course Progress</div>
        </div>
        <div className="text-sm text-white">{state.progress.course}</div>
        <div className="mt-1 text-xs text-white/55">{state.progress.module}</div>
        <div className="mt-3"><ProgressBar value={state.progress.completionPercent} /></div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/65">
          <span>{state.progress.watchTimeMinutes} min watch time</span>
          <span className="text-right">{state.progress.remainingLessons} lessons left</span>
        </div>
      </Card>

      <footer className="flex items-center justify-between text-xs text-white/45">
        <span className="inline-flex items-center gap-1"><Bell size={13} /> Notifications {state.settings.notificationsEnabled ? "on" : "off"}</span>
        <span>Level {state.progress.level}</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
