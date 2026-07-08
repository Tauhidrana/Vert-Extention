# ZverTs Focus

Production-ready Chrome Extension (Manifest V3) for ZverTs learning protection.

## Features

- Smart ad/tracker blocking with Manifest V3 declarative net request rules.
- Automatic Focus Mode on ZverTs course, lesson, module, watch, and quiz pages.
- Distraction redirects for social/video sites during active study sessions.
- Full-screen premium Focus page with Continue Learning / Return to ZverTs actions.
- Persistent session timer with Chrome alarms and storage-backed auto resume.
- Popup dashboard for remaining time, XP, streak, mission, gems, level, and course progress.
- ZverTs content bridge for progress, notifications, quiz rules, and admin policy updates.
- Quiz Mode protections for right click, copy, paste, drag, selection, print/save shortcuts, fullscreen exits, and tab switches where Chrome allows detection.
- YouTube Learning Mode when opened from ZverTs, hiding recommendations, comments, Shorts, feeds, and ad surfaces.
- Options UI for whitelist, notifications, Pomodoro length, theme, reminders, blocked sites, quiz warning count, Supabase URL, and JWT.

## ZverTs Site Integration

The extension listens for these page messages from `https://www.zverts.com`:

```ts
window.postMessage({ type: "ZVERTS_PROGRESS_UPDATE", progress: { xp: 1500 } }, location.origin);
window.postMessage({ type: "ZVERTS_NOTIFICATION", title: "XP Earned", message: "+50 XP" }, location.origin);
window.postMessage({ type: "ZVERTS_FOCUS_POLICY", policy: { quizWarningLimit: 2 } }, location.origin);
window.postMessage({ type: "ZVERTS_QUIZ_START", config: { quizAction: "lock" } }, location.origin);
```

The page can also expose metadata with:

```html
<meta name="zverts:course" content="Course name" />
<meta name="zverts:lesson" content="Lesson name" />
```

or `data-zverts-course`, `data-zverts-lesson`, and `data-zverts-quiz` attributes.

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
