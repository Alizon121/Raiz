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
import { auth } from "../firebase/config";

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

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

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error("Apple sign-in did not return an identity token.");
  }

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce,
  });

  return signInWithCredential(auth, credential);
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
