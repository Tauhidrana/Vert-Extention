# ZverTs Focus

Production-ready Chrome Extension (Manifest V3) for ZverTs focus protection.

## Features

- Ad/tracker blocking with Manifest V3 declarative net request rules only while Focus Mode is active.
- Automatic Focus Mode when any `zverts.com` tab is open.
- Automatic idle mode when no `zverts.com` tab exists, so normal browsing is untouched.
- Distraction redirects for social/video sites during active ZverTs focus sessions.
- Full-screen premium Focus page with a Return to ZverTs action.
- Persistent focus timer with Chrome alarms.
- Popup protection panel for remaining time, protected websites, blocked requests, focus duration, prevented distractions, live status, and ZverTs-provided course/task data.
- ZverTs content bridge for progress, notifications, quiz rules, and admin policy updates.
- Quiz Mode protections for right click, copy, paste, drag, selection, print/save shortcuts, fullscreen exits, and tab switches where Chrome allows detection.
- YouTube Learning Mode when opened from ZverTs, hiding recommendations, comments, Shorts, feeds, and ad surfaces.
- Options UI for allowed sites, focus duration, notifications, sound, auto-start, Supabase URL, and JWT.

## ZverTs Site Integration

The extension listens for these page messages from `https://www.zverts.com`:

```ts
window.postMessage({
  type: "ZVERTS_LEARNING_CONTEXT",
  context: {
    currentCourse: "Higher Mathematics",
    currentModule: "Module 8 / 21",
    currentTask: "Watch Module",
    completionPercent: 67
  }
}, location.origin);
window.postMessage({ type: "ZVERTS_NOTIFICATION", title: "Lesson Ready", message: "Continue your current module." }, location.origin);
window.postMessage({ type: "ZVERTS_FOCUS_POLICY", policy: { quizWarningLimit: 2 } }, location.origin);
window.postMessage({ type: "ZVERTS_QUIZ_START", config: { quizAction: "lock" } }, location.origin);
```

The page can also expose metadata with:

```html
<meta name="zverts:course" content="Course name" />
<meta name="zverts:module" content="Module 8 / 21" />
<meta name="zverts:completion" content="67" />
```

or `data-zverts-course`, `data-zverts-module`, `data-zverts-completion`, and `data-zverts-quiz` attributes.

## Supabase

No secrets are bundled. Add a user JWT and Supabase URL in the options page. Events are posted to:

- `POST /functions/v1/focus-events`
- `GET /functions/v1/focus-policy`

Validate JWTs server-side in Supabase Edge Functions.

## Build

```bash
npm install
npm run build
```

Load the generated `dist` folder in Chrome at `chrome://extensions` with Developer Mode enabled.

## Chrome Limitations

Chrome extensions cannot prevent uninstalling or disabling. ZverTs Focus records interruptions, warns the student, and can notify the backend when technically possible.
