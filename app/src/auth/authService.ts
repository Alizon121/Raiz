import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase/config";

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Deliberately duck-types on `.code` rather than `error instanceof
 * FirebaseError` — under Metro, firebase/app and firebase/auth can end up
 * bundling separate copies of the underlying @firebase/util class, which
 * makes instanceof unreliable even though the thrown error genuinely has
 * the right code. This works regardless of which copy constructed it.
 */
export function isFirebaseAuthError(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  "apple.com": "Apple",
};

/**
 * Firebase's client SDK can't tell you which provider an email is
 * registered with (fetchSignInMethodsForEmail always returns [] under Email
 * Enumeration Protection, which is on by default and can't be disabled per
 * project). This calls a Cloud Function backed by the Admin SDK instead, so
 * we can turn a generic "invalid credential" into "you signed up with
 * Google" when that's genuinely what happened. Only call this after a
 * password sign-in has already failed — see EmailAuthScreen — so it doesn't
 * become its own account-enumeration oracle.
 */
export async function getLinkedProviderLabel(email: string): Promise<string | null> {
  const getSignInMethods = httpsCallable<{ email: string }, { providers: string[] }>(functions, "getSignInMethods");
  const { data } = await getSignInMethods({ email });
  const provider = data.providers.find((p) => p in PROVIDER_LABELS);
  return provider ? PROVIDER_LABELS[provider] : null;
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Permanently deletes the signed-in user's account and all their data
 * (Firestore doc + scanHistory, Firebase Auth record) via the deleteAccount
 * Cloud Function, then clears the local session. There's no undo — callers
 * are responsible for confirming with the user first (see
 * DeleteAccountScreen).
 */
export async function deleteAccount() {
  const callDeleteAccount = httpsCallable(functions, "deleteAccount");
  await callDeleteAccount();
  await firebaseSignOut(auth);
}

// expo-apple-authentication rejects with one of these `.code` values (see
// its AppleAuthenticationExceptions.swift) rather than a message meant for
// end users — e.g. ERR_REQUEST_UNKNOWN's default text is "The authorization
// attempt failed for an unknown reason", which is what you get when the
// device isn't signed into an Apple ID at all. Mapped codes get a message
// AuthWelcomeScreen can show directly; anything unmapped falls through with
// its original message.
const APPLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  ERR_REQUEST_CANCELED: "Apple authentication cancelled.",
  ERR_REQUEST_UNKNOWN: "Unable to authenticate using an Apple ID. Please ensure you are signed into Apple on your device.",
};

/**
 * Native "Sign in with Apple" via expo-apple-authentication, exchanged for
 * a Firebase credential. Requires ios.usesAppleSignIn in app.json and the
 * "Sign In with Apple" capability enabled in your Apple Developer account —
 * see app/README.md. iOS only; Apple does not offer a native flow on Android.
 */
export async function signInWithApple() {
  // Apple's guidance: send Apple a SHA-256 hash of the nonce, then give
  // Firebase the original raw value — Firebase hashes it again itself to
  // verify against what Apple signed. Sending Apple the raw nonce directly
  // (skipping the hash step) works but is weaker against replay.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let appleCredential;
  try {
    console.log("[apple-auth] Presenting native Apple sign-in sheet…");
    appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
    console.log("[apple-auth] signInAsync resolved. Has identityToken:", !!appleCredential.identityToken);
  } catch (error) {
    console.log("[apple-auth] signInAsync rejected:", error);
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (typeof code === "string" && code in APPLE_AUTH_ERROR_MESSAGES) {
      throw new Error(APPLE_AUTH_ERROR_MESSAGES[code]);
    }
    throw error;
  }

  if (!appleCredential.identityToken) {
    throw new Error("Apple sign-in did not return an identity token.");
  }

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  console.log("[apple-auth] Exchanging credential with Firebase…");
  try {
    const result = await signInWithCredential(auth, credential);
    console.log("[apple-auth] Firebase sign-in succeeded:", result?.user?.uid);
    return result;
  } catch (error) {
    console.log("[apple-auth] Firebase signInWithCredential rejected:", error);
    throw error;
  }
}

/**
 * Google sign-in via @react-native-google-signin/google-signin, exchanged
 * for a Firebase credential. Requires GoogleService-Info.plist /
 * google-services.json in place and the Google sign-in provider enabled in
 * Firebase — see app/README.md. GoogleSignin.configure() must have already
 * been called once at app startup (done in App.tsx).
 */
export async function signInWithGoogle() {
  // Imported lazily so this native module is only touched on native
  // platforms/dev-client builds, not accidentally during a web/Expo Go run.
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token.");
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}
