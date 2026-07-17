import "../styles/global.css";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Clock,
  Globe,
  Save,
  Shield,
  ShieldCheck,
  Volume2,
  Wand2,
  Check
} from "lucide-react";
import { Button, Card, CardHeader, GhostButton, Input, Logo } from "../shared/ui";
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

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 hover:bg-white/[0.05] cursor-pointer">
      <div>
        <div className="text-sm font-semibold text-white/85">{label}</div>
        {description && <div className="mt-0.5 text-[11px] text-white/40">{description}</div>}
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-white/10 transition-colors duration-200 peer-checked:bg-zgreen/80" />
        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-zbg" />
      </div>
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

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zgreen/30 border-t-zgreen" />
          <div className="text-sm text-white/50">Loading settings...</div>
        </div>
      </div>
    );
  }

  const updateSettings = (settings: Partial<UserSettings>) =>
    setState((prev) => prev && { ...prev, settings: { ...prev.settings, ...settings } });

  const save = async () => {
    await chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: state.settings });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto max-w-2xl animate-fade-in">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <Button onClick={save}>
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Saved" : "Save Settings"}
          </Button>
        </header>

        <div className="grid gap-4">
          <Card>
            <CardHeader icon={Globe} title="Allowed Sites" />
            <textarea
              className="focus-ring min-h-36 w-full rounded-xl border border-white/[0.06] bg-black/30 p-4 text-sm text-white placeholder:text-white/25 transition-colors duration-200 focus:border-zgreen/50 focus:bg-black/40"
              value={state.settings.whitelist.join("\n")}
              onChange={(event) => updateSettings({ whitelist: linesToList(event.target.value) })}
              placeholder="zverts.com&#10;google.com"
            />
            <p className="m-0 mt-2.5 text-[11px] leading-relaxed text-white/35">
              Focus protection never blocks these domains. Keep ZverTs here.
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader icon={Clock} title="Focus Duration" />
              <Input
                type="number"
                min={5}
                value={state.settings.pomodoroMinutes}
                onChange={(event) => updateSettings({ pomodoroMinutes: Number(event.target.value) })}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {[25, 45, 60, 90].map((minutes) => (
                  <GhostButton
                    key={minutes}
                    onClick={() => updateSettings({ pomodoroMinutes: minutes })}
                    className={state.settings.pomodoroMinutes === minutes ? "!border-zgreen/50 !bg-zgreen/15 !text-zgreen" : ""}
                  >
                    {minutes}m
                  </GhostButton>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader icon={Wand2} title="Automation" />
              <div className="grid gap-2.5">
                <Toggle
                  label="Auto Start Focus"
                  description="Start blocking when ZverTs opens"
                  checked={state.settings.autoStartFocus}
                  onChange={(autoStartFocus) => updateSettings({ autoStartFocus })}
                />
                <Toggle
                  label="Notifications"
                  description="Show focus reminders"
                  checked={state.settings.notificationsEnabled}
                  onChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })}
                />
                <Toggle
                  label="Sound"
                  description="Play notification sounds"
                  checked={state.settings.soundEnabled}
                  onChange={(soundEnabled) => updateSettings({ soundEnabled })}
                />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader icon={Shield} title="Connection" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-white/60">
                Supabase URL
                <Input
                  className="mt-2"
                  placeholder="https://project.supabase.co"
                  value={state.settings.supabaseUrl ?? ""}
                  onChange={(event) => updateSettings({ supabaseUrl: event.target.value })}
                />
              </label>
              <label className="block text-sm text-white/60">
                JWT Token
                <Input
                  className="mt-2"
                  type="password"
                  placeholder="Stored locally only"
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
