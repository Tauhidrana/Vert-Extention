import "../styles/global.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, Clock, ListPlus, Save, ShieldAlert } from "lucide-react";
import { Button, Card, GhostButton, Input, Logo } from "../shared/ui";
import type { FocusPolicy, UserSettings } from "../shared/types";

interface State {
  policy: FocusPolicy;
  settings: UserSettings;
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Options() {
  const [state, setState] = useState<State | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }).then((response) => {
      setState({ policy: response.state.policy, settings: response.state.settings });
    });
  }, []);

  if (!state) return <div className="grid min-h-screen place-items-center text-white/70">Loading settings...</div>;

  const updateSettings = (settings: Partial<UserSettings>) => setState((prev) => prev && { ...prev, settings: { ...prev.settings, ...settings } });
  const updatePolicy = (policy: Partial<FocusPolicy>) => setState((prev) => prev && { ...prev, policy: { ...prev.policy, ...policy } });

  const save = async () => {
    await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: state.settings });
    await chrome.runtime.sendMessage({ type: "ADMIN_POLICY", policy: state.policy });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Button onClick={save}>
            <Save size={16} /> {saved ? "Saved" : "Save Settings"}
          </Button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Session Timer</h2>
            </div>
            <label className="mb-3 block text-sm text-white/70">
              Pomodoro length
              <Input
                className="mt-2"
                type="number"
                min={5}
                value={state.settings.pomodoroMinutes}
                onChange={(event) => updateSettings({ pomodoroMinutes: Number(event.target.value) })}
              />
            </label>
            <label className="block text-sm text-white/70">
              Study reminder interval
              <Input
                className="mt-2"
                type="number"
                min={1}
                value={state.settings.studyReminderMinutes}
                onChange={(event) => updateSettings({ studyReminderMinutes: Number(event.target.value) })}
              />
            </label>
            <div className="mt-4 flex gap-2">
              {[25, 45, 60, 90].map((minutes) => (
                <GhostButton key={minutes} onClick={() => updateSettings({ pomodoroMinutes: minutes })}>{minutes}m</GhostButton>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Bell className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Notifications</h2>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
              Enable lesson, XP, mission, certificate, and quiz alerts
              <input
                type="checkbox"
                className="h-5 w-5 accent-zgreen"
                checked={state.settings.notificationsEnabled}
                onChange={(event) => updateSettings({ notificationsEnabled: event.target.checked })}
              />
            </label>
            <label className="mt-4 block text-sm text-white/70">
              Theme
              <select
                className="focus-ring mt-2 min-h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white"
                value={state.settings.theme}
                onChange={(event) => updateSettings({ theme: event.target.value as UserSettings["theme"] })}
              >
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Focus Blocking</h2>
            </div>
            <label className="block text-sm text-white/70">
              Blocked websites
              <textarea
                className="focus-ring mt-2 min-h-44 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white"
                value={state.policy.blockedSites.join("\n")}
                onChange={(event) => updatePolicy({ blockedSites: linesToList(event.target.value) })}
              />
            </label>
            <label className="mt-4 block text-sm text-white/70">
              Whitelist websites
              <textarea
                className="focus-ring mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white"
                value={state.settings.whitelist.join("\n")}
                onChange={(event) => updateSettings({ whitelist: linesToList(event.target.value) })}
              />
            </label>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ListPlus className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Admin Control</h2>
            </div>
            <label className="mb-3 block text-sm text-white/70">
              Quiz warning count
              <Input
                className="mt-2"
                type="number"
                min={1}
                value={state.policy.quizWarningLimit}
                onChange={(event) => updatePolicy({ quizWarningLimit: Number(event.target.value) })}
              />
            </label>
            <label className="mb-3 block text-sm text-white/70">
              Supabase URL
              <Input
                className="mt-2"
                placeholder="https://project.supabase.co"
                value={state.settings.supabaseUrl ?? ""}
                onChange={(event) => updateSettings({ supabaseUrl: event.target.value })}
              />
            </label>
            <label className="block text-sm text-white/70">
              JWT
              <Input
                className="mt-2"
                type="password"
                placeholder="Stored locally; no service keys"
                value={state.settings.jwt ?? ""}
                onChange={(event) => updateSettings({ jwt: event.target.value })}
              />
            </label>
          </Card>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
