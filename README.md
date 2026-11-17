# Purrch

A little focus. A little purr. An independent Android focus companion with an original, editable cat room. Inspired by the general cozy focus-timer idea, with no artwork or code copied from Cat on Chair.

## Install on Android

Download **purrch.apk** from [Releases](https://github.com/lucilegrls/purrch-focus/releases/latest), open it on your phone, and allow installation from your browser when Android asks. Requires Android 7 or later and an up-to-date Android System WebView. No Play Store payment or account is required.

In Purrch, tap **Set up app protection**. Read the disclosure, open Android Accessibility settings, and enable **Purrch Focus Guard**. On some Android versions, a sideloaded APK first needs Settings → Apps → Purrch → ⋮ → Allow restricted settings. The exact menus vary by phone. In Purrch Settings, enable session notifications and, optionally, precise timer alarms.

Start a short test session and open a distracting app to verify protection on your phone. The service covers other apps during focus and count-up sessions, including paused sessions. It automatically releases the overlay when a timed session ends even when Purrch is in the background.

**Scope of protection:** Purrch is a focus aid, not a tamper-proof kiosk. Calls, emergency services, the home launcher, keyboard, Android Settings and system controls remain available. You can end the session, disable accessibility, force-stop, or uninstall it. Split-screen, picture-in-picture, overlays, notification actions and manufacturer restrictions can bypass protection. Some phones require allowing background activity in battery settings. The service does not block internet at the network level. The browser preview cannot block other apps.

## Included

- Focus sessions from 30 minutes to 3 hours, with 30m / 1h / 1h30 / 2h / 3h shortcuts on phones and computers. Default: 30 minutes; custom minute values in Settings. Count-up, pause/resume, short and long breaks.
- Persistent timestamps: suspended apps recover the correct remaining time and credit a completed session once.
- Fish for completed focus minutes (up to 60 per session), collectible gifts, tradeable paper for interrupted sessions.
- Furniture shop; editable cat name, coat, chair and walls; three ready-made palettes; room image export.
- Tasks with due dates, focus task selection, seven-day chart and session history.
- Locally synthesized rain and purr sounds; no streamed audio or paid API.
- Native completion notifications, native accessibility blocker, offline browser installation.
- JSON progress export/import. No accounts, subscriptions, ads, analytics or backend.

Task dates are organizational labels; task reminder notifications are not implemented. Ambient audio may pause when Android suspends the WebView. Notifications depend on OS permissions, exact-alarm settings and battery restrictions. No Apple Watch, iCloud, health/calendar integrations or home-screen widgets are included. Native and browser progress are separate; transfer using a backup. History retains the latest 5,000 sessions.

## Development

Use Node 24+ and npm. For native builds use JDK 21 and Android SDK 36.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run android:sync
cd android
./gradlew :app:testDebugUnitTest :app:assembleDebug
```

GitHub Actions builds a signed release APK, runs timer/economy/backup tests and Android policy tests, and exercises the accessibility overlay on an Android 15 emulator before publishing the preview. Public-repository standard GitHub-hosted runners and GitHub Pages are used. No paid cloud backend is needed.

Release signing uses `ANDROID_KEYSTORE_BASE64` and `ANDROID_KEYSTORE_PASSWORD` repository secrets. The PKCS12 alias is `purrch`. Keep the private signing key outside Git and back it up securely: updates must use the same key. Do not expose it in artifacts or logs. Increment `versionCode` for subsequent APK versions. Release APKs are non-debuggable.

## Customize

Change colors and the cat name in **My room**. The default painted reading nook has a separate watercolor tabby with awake and sleeping states. Room, chair and coat controls apply subtle tints; choose Simple drawn room for flat, fully recolorable shapes. The smaller cat is positioned independently on the cushion. Original generated PNGs and exact prompts are in `artwork/`; optimized WebP layers are in `src/assets/painted/`. The references themselves are not redistributed. Composition lives in `src/PaintedRoom.tsx`, the alternative vector room in `src/ClassicRoom.tsx`, screen layout in `src/App.tsx`, warm styling in `src/reading-theme.css`, and reward rules in `src/model.ts`. Icons regenerate with `node scripts/icons.mjs`. No design subscription is required.

## Privacy

Progress is stored in app-private preferences (browser local storage for the preview). The accessibility service listens only to foreground window package names; `canRetrieveWindowContent=false`. It never retrieves message text, view trees, passwords or keystrokes. It does not store app usage history or send data to a server. Android cloud backup is disabled. Explicit exports use Android’s share sheet. Clearing storage or uninstalling deletes progress, so export first.

Fonts (Nunito and Lora) are bundled from Fontsource under the SIL Open Font License. Icons use Lucide (ISC). Application source and project artwork are provided under the repository MIT license; generated art is identified in the notices. See `THIRD_PARTY_NOTICES.md`.
