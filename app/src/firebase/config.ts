import AsyncStorage from "@react-native-async-storage/async-storage";
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
// @ts-expect-error -- getReactNativePersistence exists at runtime in the RN build of firebase/auth
// but isn't in the package's public TS types yet; see README for details.
import { type Auth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// These are public client identifiers (not secrets) — Firebase's own docs
// confirm it's safe to ship them in a client bundle; access control happens
// via Firestore security rules and Auth, not by hiding this config.
// Values come from Firebase Console > Project settings > General > Your apps > Web app.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    console.warn(
      `[firebase] Missing EXPO_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()} — ` +
        "see app/README.md for setup.",
    );
  }
}

export const firebaseApp: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// initializeAuth (not getAuth) is required on React Native so we can pass an
// AsyncStorage-backed persistence layer — without it, auth state doesn't
// survive an app restart and silently falls back to in-memory only.
export const auth: Auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(firebaseApp);
