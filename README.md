# VerT Focus

AI-powered distraction blocker and learning protection Chrome Extension for [ZverTs](https://zverts.com) students. Built with Manifest V3, React, TypeScript, and Tailwind CSS.

## Features

### Focus Mode
- **Auto-activation** when any `zverts.com` tab is open
- **Auto-deactivation** when all ZverTs tabs close — normal browsing is untouched
- **Persistent timer** with configurable duration (25 / 45 / 60 / 90 min) via Chrome alarms
- **Study reminders** at configurable intervals

### Distraction Blocking
- **Social/video site blocking** — Facebook, Instagram, TikTok, Twitter/X, Reddit, Discord, Netflix, and more are redirected during focus sessions
- **YouTube grace period** — 5-minute window before YouTube is blocked, with a live countdown badge
- **Ad/tracker blocking** — declarativeNetRequest rules for DoubleClick, Google Analytics, YouTube ads, enabled only during focus sessions
- **Whitelist** — user-configurable allowed sites that are never blocked

### Exam Protection (Quiz Mode)
- Activated via `ZVERTS_QUIZ_START` message or `data-zverts-quiz` DOM marker
- Blocks: right-click, copy/paste, drag/drop, text selection, print screen, DevTools shortcuts
- Enforces fullscreen — pauses quiz if fullscreen exits
- Tracks tab switches, focus loss, and DevTools attempts
- AI tool blocking — ChatGPT, Claude, Gemini, Copilot, DeepSeek, Perplexity, and more
- Configurable violation limit with auto-lock or auto-submit actions

### YouTube Learning Mode
- Activates when YouTube is opened from ZverTs
- Hides recommendations, comments, Shorts, feeds, and ad surfaces
- Clean video player layout

### UI
- **Popup** — timer ring, session stats (blocked requests, distractions, interruptions), current course progress, rewards (XP, gems, streak), protection badges
- **Options** — whitelist editor, focus duration, notifications, sound, auto-start toggle
- **Focus page** — full-screen blocked page with "Return to ZverTs" action

## Architecture

```
src/
├── background/index.ts       # Service worker — session management, navigation blocking, alarms
├── content/
│   ├── zverts.ts             # ZverTs content script — session sync, quiz shield, link interception
│   └── youtube.ts            # YouTube learning mode — hides distractions
├── popup/main.tsx            # Extension popup UI
├── options/main.tsx          # Settings page
├── focus/main.tsx            # Full-screen blocked page
├── shared/
│   ├── types.ts              # TypeScript interfaces (FocusSession, FocusPolicy, LearningContext, etc.)
│   ├── storage.ts            # Chrome storage wrapper
│   ├── defaults.ts           # Default policy, session, and settings values
│   ├── url.ts                # URL parsing and matching utilities
│   ├── ai-blocklist.ts       # AI tool domains blocked during quizzes
│   ├── supabase.ts           # Supabase Edge Function integration
│   ├── cn.ts                 # clsx + tailwind-merge utility
│   └── ui.tsx                # Shared React components (Card, Button, Stat, ProgressBar, etc.)
```

## ZverTs Site Integration

The website is the source of truth — the extension does not hardcode course data. When a ZverTs tab is active, the content script:

1. Requests the current session via `postMessage`
2. Dispatches a `zverts-focus:request-session` custom event
3. Fetches authenticated same-origin session endpoints
4. Listens for realtime session updates from the website

### Supported API Endpoints

```
GET /api/learning/session/active
GET /api/learning-sessions/active
GET /api/learning/active-session
GET /api/focus/session
GET /api/me/learning-session
```

### Website Messages

The ZverTs website should push updates via `window.postMessage`:

```ts
// Active learning session
window.postMessage({
  type: "ZVERTS_ACTIVE_LEARNING_SESSION",
  session: {
    id: "session_123",
    course: { name: "Higher Math", thumbnail: "https://www.zverts.com/course.jpg" },
    module: { name: "Module 5" },
    lesson: { name: "Functions", number: 21 },
    progress: {
      completionPercent: 63,
      lessonsCompleted: 21,
      totalLessons: 34,
      watchTime: "7:48",
      remainingTime: "2:15"
    },
    currentTask: "Watch Module",
    dailyMission: { progress: 80 },
    userStats: { xp: 1200, gems: 40, streak: 6 }
  }
}, location.origin);

// No active session
window.postMessage({ type: "ZVERTS_ACTIVE_LEARNING_SESSION", session: null }, location.origin);

// Notifications
window.postMessage({ type: "ZVERTS_NOTIFICATION", title: "Lesson Ready", message: "Continue your current module." }, location.origin);

// Admin policy updates
window.postMessage({ type: "ZVERTS_FOCUS_POLICY", policy: { quizWarningLimit: 2 } }, location.origin);

// Quiz lifecycle
window.postMessage({ type: "ZVERTS_QUIZ_START", quizSessionId: "quiz_123", config: { quizAction: "lock" } }, location.origin);
window.postMessage({ type: "ZVERTS_QUIZ_END", reason: "submitted" }, location.origin);
```

## Supabase Integration

No secrets are bundled. Configure your Supabase URL and JWT in the extension options page. Events are posted to:

- `POST /functions/v1/focus-events` — focus session events
- `GET /functions/v1/focus-policy` — admin policy overrides

Validate JWTs server-side in Supabase Edge Functions.

## Build

```bash
npm install
npm run build
```

Load the generated `dist/` folder in Chrome at `chrome://extensions` with Developer Mode enabled.

### Development

```bash
npm run dev       # Vite dev server with HMR
npm run preview   # Preview built extension
npx vitest run    # Run tests
```

## Chrome Limitations

Chrome extensions cannot prevent uninstalling or disabling. VerT Focus records interruptions, warns the student, and can notify the backend when technically possible.
