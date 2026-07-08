import type { FocusEvent, FocusPolicy, UserSettings } from "./types";

export async function postSecureEvent(settings: UserSettings, event: FocusEvent) {
  if (!settings.supabaseUrl || !settings.jwt) return;

  const endpoint = `${settings.supabaseUrl.replace(/\/$/, "")}/functions/v1/focus-events`;
  await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${settings.jwt}`
    },
    body: JSON.stringify(event)
  });
}

export async function fetchAdminPolicy(settings: UserSettings): Promise<Partial<FocusPolicy> | null> {
  if (!settings.supabaseUrl || !settings.jwt) return null;

  const endpoint = `${settings.supabaseUrl.replace(/\/$/, "")}/functions/v1/focus-policy`;
  const response = await fetch(endpoint, {
    headers: { authorization: `Bearer ${settings.jwt}` }
  });
  if (!response.ok) return null;
  return (await response.json()) as Partial<FocusPolicy>;
}
