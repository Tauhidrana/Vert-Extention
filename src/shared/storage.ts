import { DEFAULT_POLICY, DEFAULT_PROGRESS, DEFAULT_SETTINGS, EMPTY_SESSION } from "./defaults";
import type { FocusEvent, FocusPolicy, FocusSession, UserProgress, UserSettings } from "./types";

const keys = {
  session: "focusSession",
  policy: "focusPolicy",
  progress: "userProgress",
  settings: "userSettings",
  events: "focusEvents"
} as const;

const get = <T>(key: string, fallback: T): Promise<T> =>
  chrome.storage.local.get(key).then((data) => ({ ...fallback, ...(data[key] ?? {}) }) as T);

export const storage = {
  getSession: () => get<FocusSession>(keys.session, EMPTY_SESSION),
  setSession: (session: FocusSession) => chrome.storage.local.set({ [keys.session]: session }),
  getPolicy: () => get<FocusPolicy>(keys.policy, DEFAULT_POLICY),
  setPolicy: (policy: FocusPolicy) => chrome.storage.local.set({ [keys.policy]: policy }),
  getProgress: () => get<UserProgress>(keys.progress, DEFAULT_PROGRESS),
  setProgress: (progress: UserProgress) => chrome.storage.local.set({ [keys.progress]: progress }),
  getSettings: () => get<UserSettings>(keys.settings, DEFAULT_SETTINGS),
  setSettings: (settings: UserSettings) => chrome.storage.local.set({ [keys.settings]: settings }),
  async getEvents(): Promise<FocusEvent[]> {
    const data = await chrome.storage.local.get(keys.events);
    return Array.isArray(data[keys.events]) ? data[keys.events] : [];
  },
  async addEvent(event: Omit<FocusEvent, "id" | "at"> & { at?: number }) {
    const events = await storage.getEvents();
    const next = [
      {
        id: crypto.randomUUID(),
        at: event.at ?? Date.now(),
        ...event
      },
      ...events
    ].slice(0, 300);
    await chrome.storage.local.set({ [keys.events]: next });
  },
  keys
};
