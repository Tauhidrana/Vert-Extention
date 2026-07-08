# VerT Focus

Production-ready Chrome Extension (Manifest V3) for ZverTs focus protection.

## Features

- Ad/tracker blocking with Manifest V3 declarative net request rules only while Focus Mode is active.
- Automatic Focus Mode when any `zverts.com` tab is open.
- Automatic idle mode when no `zverts.com` tab exists, so normal browsing is untouched.
- Distraction redirects for social/video sites during active ZverTs focus sessions.
- Full-screen premium Focus page with a Return to ZverTs action.
- Persistent focus timer with Chrome alarms.
- Popup protection panel for remaining time, protected websites, blocked requests, focus duration, prevented distractions, live status, and ZverTs-provided course/task data.
- ZverTs content bridge for active learning sessions, progress, notifications, quiz rules, and admin policy updates.
- Quiz Mode protections for right click, copy, paste, drag, selection, print/save shortcuts, fullscreen exits, and tab switches where Chrome allows detection.
- YouTube Learning Mode when opened from ZverTs, hiding recommendations, comments, Shorts, feeds, and ad surfaces.
- Options UI for allowed sites, focus duration, notifications, sound, auto-start, Supabase URL, and JWT.

## ZverTs Site Integration

The website is the source of truth. The extension does not hardcode course data. When a ZverTs tab is active, the content script:

- requests the current session with `window.postMessage({ type: "ZVERTS_FOCUS_REQUEST_SESSION" }, location.origin)`
- dispatches `zverts-focus:request-session`
- fetches authenticated same-origin session endpoints with `credentials: "include"`
- listens for realtime session updates from the website

Supported same-origin API endpoints:

- `GET /api/learning/session/active`
- `GET /api/learning-sessions/active`
- `GET /api/learning/active-session`
- `GET /api/focus/session`
- `GET /api/me/learning-session`

The website should answer requests and push realtime updates with:

```ts
window.postMessage({
  type: "ZVERTS_ACTIVE_LEARNING_SESSION",
  session: {
    id: "session_123",
    course: {
      name: "Higher Math",
      thumbnail: "https://www.zverts.com/course.jpg"
    },
    module: {
      name: "Module 5"
    },
    lesson: {
      name: "Functions",
      number: 21
    },
    progress: {
      completionPercent: 63,
      lessonsCompleted: 21,
      totalLessons: 34,
      watchTime: "7:48",
      remainingTime: "2:15"
    },
    currentTask: "Watch Module",
    dailyMission: {
      progress: 80
    },
    userStats: {
      xp: 1200,
      gems: 40,
      streak: 6
    }
  }
}, location.origin);
window.postMessage({ type: "ZVERTS_NOTIFICATION", title: "Lesson Ready", message: "Continue your current module." }, location.origin);
window.postMessage({ type: "ZVERTS_FOCUS_POLICY", policy: { quizWarningLimit: 2 } }, location.origin);
window.postMessage({ type: "ZVERTS_QUIZ_START", quizSessionId: "quiz_123", config: { quizAction: "lock" } }, location.origin);
window.postMessage({ type: "ZVERTS_QUIZ_END", reason: "submitted" }, location.origin);
```

If no session is active, send:

```ts
window.postMessage({
  type: "ZVERTS_ACTIVE_LEARNING_SESSION",
  session: null
}, location.origin);
```

## Supabase

No secrets are bundled. Add a user JWT and Supabase URL in the options page. Events are posted to:

- `POST /functions/v1/focus-events`
- `GET /functions/v1/focus-policy`

Validate JWTs server-side in Supabase Edge Functions.

## Exam Protection

Exam Protection Mode only activates when ZverTs starts a quiz with `ZVERTS_QUIZ_START` or the page exposes an explicit quiz-active marker such as `data-zverts-quiz`.

During quiz mode the extension:

- blocks right click, context menu, drag/drop, copy, paste, cut, text selection, and common browser shortcuts where Chrome allows it
- requests fullscreen and pauses the quiz if fullscreen exits
- logs tab switches, focus loss, screenshot-key attempts, developer-tool shortcuts, and best-effort DevTools viewport detection
- blocks AI tools only during quiz mode
- redirects AI tool attempts to the local extension block page
- sends quiz events back to the ZverTs page as `ZVERTS_FOCUS_QUIZ_EVENT`

The configurable AI blocklist lives in `src/shared/ai-blocklist.ts`.

## Build

```bash
npm install
npm run build
```

Load the generated `dist` folder in Chrome at `chrome://extensions` with Developer Mode enabled.

## Chrome Limitations

Chrome extensions cannot prevent uninstalling or disabling. VerT Focus records interruptions, warns the student, and can notify the backend when technically possible.
