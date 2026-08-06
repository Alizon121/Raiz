# Raiz — App (Phase 2: shell + auth)

Expo + TypeScript app. This phase covers project scaffolding, navigation, and
Firebase Auth (email/password, Sign in with Apple, Google Sign-In). Scanning,
produce detail, history, and the paywall are later phases.

Bundle identifier / package name: `com.raiz.app` (same on iOS and Android).

## Why this needs a dev client, not Expo Go

Apple and Google sign-in both use native modules (`expo-apple-authentication`,
`@react-native-google-signin/google-signin`) that Expo Go doesn't include.
This project is built with `expo-dev-client` from the start — you build your
own custom "dev client" once (via `expo run:ios` / `expo run:android`, or an
EAS development build), then iterate normally with `expo start` against that
client, same as you would with Expo Go.

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Register apps in Firebase Console (project: `raiz-a6479`)

You'll need three app registrations under **Project settings > General > Your
apps** — one Web app (for the JS SDK config) plus native iOS/Android apps
(for the platform config files the native sign-in SDKs need):

- **Web app** — register one, then copy the `firebaseConfig` values into
  `.env` (copy `.env.example` to `.env` first). These are public client
  identifiers, not secrets.
- **iOS app** — bundle ID `com.raiz.app`. Download the resulting
  `GoogleService-Info.plist` and place it at `app/GoogleService-Info.plist`
  (gitignored — each environment/developer downloads their own copy).
- **Android app** — package name `com.raiz.app`. Download
  `google-services.json` and place it at `app/google-services.json`
  (also gitignored).

### 3. Enable sign-in providers

**Authentication > Sign-in method** in the Firebase Console, enable:
- **Email/Password**
- **Google** — once enabled, Firebase auto-creates a "Web client" OAuth
  client ID. Copy it into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- **Apple** — you can enable this provider in Firebase with the Team ID /
  Services ID / private key fields left blank. Those are only used for
  Apple's *OAuth web-redirect* flow (signing in from a website or Android);
  our implementation uses the native iOS flow
  (`expo-apple-authentication` → `signInWithCredential`), where Firebase
  verifies Apple's signed JWT directly against Apple's public keys — no
  server-side Apple credentials needed.

  Separately, actually *using* Sign In with Apple on a physical device or
  the App Store requires a paid Apple Developer Program membership ($99/yr)
  to attach the capability to a provisioning profile — Simulator builds
  don't need this since they aren't code-signed. Until you have that
  membership, leave `EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED` unset/`false` in
  `.env` — `AuthScreen` hides the Apple button entirely in that case, rather
  than showing one that fails when tapped. Flip it to `true` once you've
  enrolled and enabled the capability (App IDs > `com.raiz.app` >
  Capabilities, in your Apple Developer account).

### 4. Build the dev client

```
npx expo prebuild --clean
npx expo run:ios       # requires Xcode, generates + launches the dev client
npx expo run:android   # requires Android Studio/SDK
```

After the first build, subsequent iteration is just:
```
npx expo start
```
and opening the dev client already installed on your simulator/device — no
need to rebuild unless you add another native module.

## What's wired up

- `src/firebase/config.ts` — Firebase app/auth/Firestore init.
  `initializeAuth` (not `getAuth`) with an AsyncStorage persistence layer,
  since without it auth state doesn't survive an app restart on React Native.
- `src/auth/authService.ts` — email/password, Apple, and Google sign-in, all
  normalized to a Firebase credential via `signInWithCredential`.
- `src/auth/AuthContext.tsx` — `onAuthStateChanged` wrapper; also creates the
  `users/{userId}` Firestore doc on first sign-in per the build spec's schema
  (`subscriptionStatus: "none"`, `revenueCatAppUserId: null` until RevenueCat
  is wired up in a later phase).
- `src/navigation/RootNavigator.tsx` — Onboarding (shown once, flag in
  AsyncStorage) → Auth, or straight to a bottom-tab main app if already
  signed in. Only two tabs exist right now (Scan, Settings) — History,
  Produce Detail, and the Paywall get added as their phases land.

## Known gaps / next steps

1. **No error-state UI for "Firebase env vars missing"** beyond a console
   warning in `config.ts` — if you see a blank/crashing auth screen, check
   the terminal for that warning first before assuming the code is broken.
2. **Google Sign-In `webClientId` must be the Firebase-generated "Web
   client"**, not the iOS or Android OAuth client ID — using the wrong one is
   the most common setup mistake here and fails silently/cryptically.
