import "../styles/global.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, Clock, Save, ShieldCheck, Volume2, Wand2 } from "lucide-react";
import { Button, Card, GhostButton, Input, Logo } from "../shared/ui";
import type { UserSettings } from "../shared/types";

interface State {
  settings: UserSettings;
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white/75">
      {label}
      <input type="checkbox" className="h-5 w-5 accent-zgreen" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Options() {
  const [state, setState] = useState<State | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }).then((response) => {
      setState({ settings: response.state.settings });
    });
  }, []);

  if (!state) return <div className="grid min-h-screen place-items-center text-white/70">Loading settings...</div>;

  const updateSettings = (settings: Partial<UserSettings>) => setState((prev) => prev && { ...prev, settings: { ...prev.settings, ...settings } });

  const save = async () => {
    await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: state.settings });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Button onClick={save}>
            <Save size={16} /> {saved ? "Saved" : "Save Settings"}
          </Button>
        </header>

        <div className="grid gap-4">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Allowed Sites</h2>
            </div>
            <textarea
              className="focus-ring min-h-32 w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white"
              value={state.settings.whitelist.join("\n")}
              onChange={(event) => updateSettings({ whitelist: linesToList(event.target.value) })}
            />
            <p className="m-0 mt-2 text-xs leading-5 text-white/45">Focus protection never blocks these domains. Keep ZverTs here.</p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="text-zgreen" size={18} />
                <h2 className="m-0 text-lg font-black">Focus Duration</h2>
              </div>
              <Input
                type="number"
                min={5}
                value={state.settings.pomodoroMinutes}
                onChange={(event) => updateSettings({ pomodoroMinutes: Number(event.target.value) })}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {[25, 45, 60, 90].map((minutes) => (
                  <GhostButton key={minutes} onClick={() => updateSettings({ pomodoroMinutes: minutes })}>{minutes}m</GhostButton>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Wand2 className="text-zgreen" size={18} />
                <h2 className="m-0 text-lg font-black">Automation</h2>
              </div>
              <div className="grid gap-3">
                <Toggle label="Auto Start Focus" checked={state.settings.autoStartFocus} onChange={(autoStartFocus) => updateSettings({ autoStartFocus })} />
                <Toggle label="Notifications" checked={state.settings.notificationsEnabled} onChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })} />
                <Toggle label="Sound" checked={state.settings.soundEnabled} onChange={(soundEnabled) => updateSettings({ soundEnabled })} />
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Bell className="text-zgreen" size={18} />
              <h2 className="m-0 text-lg font-black">Connection</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-white/70">
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
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
