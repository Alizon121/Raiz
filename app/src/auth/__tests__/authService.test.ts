// Native modules (Apple/Google sign-in, expo-crypto) and Firebase are
// mocked — this suite verifies our own glue logic (nonce hashing, credential
// construction, error paths), not the SDKs themselves.

jest.mock("../../firebase/config", () => ({ auth: { __fake: "auth" }, functions: { __fake: "functions" } }));

const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockFirebaseSignOut = jest.fn();
const mockSignInWithCredential = jest.fn();
const mockOAuthProviderCredential = jest.fn();
const mockGoogleAuthProviderCredential = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
  signInWithCredential: (...args: unknown[]) => mockSignInWithCredential(...args),
  OAuthProvider: jest.fn().mockImplementation(() => ({ credential: mockOAuthProviderCredential })),
  GoogleAuthProvider: { credential: (...args: unknown[]) => mockGoogleAuthProviderCredential(...args) },
}));

const mockGetSignInMethodsCallable = jest.fn();
const mockHttpsCallable = jest.fn((..._args: unknown[]) => mockGetSignInMethodsCallable);
jest.mock("firebase/functions", () => ({
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

const mockAppleSignInAsync = jest.fn();
jest.mock("expo-apple-authentication", () => ({
  signInAsync: (...args: unknown[]) => mockAppleSignInAsync(...args),
  AppleAuthenticationScope: { FULL_NAME: "full-name", EMAIL: "email" },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: () => "test-raw-nonce",
  digestStringAsync: jest.fn(async () => "test-hashed-nonce"),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

const mockGoogleHasPlayServices = jest.fn();
const mockGoogleSignIn = jest.fn();
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: (...args: unknown[]) => mockGoogleHasPlayServices(...args),
    signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
  },
}));

import {
  getLinkedProviderLabel,
  isFirebaseAuthError,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from "../authService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("email/password auth", () => {
  it("signInWithEmail calls Firebase with the given email and password", async () => {
    await signInWithEmail("a@b.com", "hunter2");
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith({ __fake: "auth" }, "a@b.com", "hunter2");
  });

  it("signUpWithEmail calls Firebase's create-user function, not sign-in", async () => {
    await signUpWithEmail("new@b.com", "hunter2");
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith({ __fake: "auth" }, "new@b.com", "hunter2");
    expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("signOut calls Firebase's signOut with our auth instance", async () => {
    await signOut();
    expect(mockFirebaseSignOut).toHaveBeenCalledWith({ __fake: "auth" });
  });
});

describe("signInWithApple", () => {
  it("sends Apple the hashed nonce but gives Firebase the raw nonce", async () => {
    mockAppleSignInAsync.mockResolvedValue({ identityToken: "apple-id-token" });

    await signInWithApple();

    expect(mockAppleSignInAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: "test-hashed-nonce" }),
    );
    expect(mockOAuthProviderCredential).toHaveBeenCalledWith({
      idToken: "apple-id-token",
      rawNonce: "test-raw-nonce",
    });
  });

  it("exchanges the resulting credential with Firebase via signInWithCredential", async () => {
    mockAppleSignInAsync.mockResolvedValue({ identityToken: "apple-id-token" });
    mockOAuthProviderCredential.mockReturnValue({ __fake: "apple-credential" });

    await signInWithApple();

    expect(mockSignInWithCredential).toHaveBeenCalledWith({ __fake: "auth" }, { __fake: "apple-credential" });
  });

  it("throws instead of silently proceeding when Apple returns no identity token", async () => {
    mockAppleSignInAsync.mockResolvedValue({ identityToken: null });

    await expect(signInWithApple()).rejects.toThrow("Apple sign-in did not return an identity token.");
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });
});

describe("signInWithGoogle", () => {
  it("checks Play Services before signing in", async () => {
    mockGoogleSignIn.mockResolvedValue({ data: { idToken: "google-id-token" } });

    await signInWithGoogle();

    expect(mockGoogleHasPlayServices).toHaveBeenCalledWith({ showPlayServicesUpdateDialog: true });
    expect(mockGoogleAuthProviderCredential).toHaveBeenCalledWith("google-id-token");
  });

  it("exchanges the Google credential with Firebase via signInWithCredential", async () => {
    mockGoogleSignIn.mockResolvedValue({ data: { idToken: "google-id-token" } });
    mockGoogleAuthProviderCredential.mockReturnValue({ __fake: "google-credential" });

    await signInWithGoogle();

    expect(mockSignInWithCredential).toHaveBeenCalledWith({ __fake: "auth" }, { __fake: "google-credential" });
  });

  it("throws instead of silently proceeding when Google returns no ID token", async () => {
    mockGoogleSignIn.mockResolvedValue({ data: {} });

    await expect(signInWithGoogle()).rejects.toThrow("Google sign-in did not return an ID token.");
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });
});

describe("isFirebaseAuthError", () => {
  it("is true for an error object with a matching code", () => {
    expect(isFirebaseAuthError({ code: "auth/invalid-credential" }, "auth/invalid-credential")).toBe(true);
  });

  it("is false for an error object with a different code", () => {
    expect(isFirebaseAuthError({ code: "auth/wrong-password" }, "auth/invalid-credential")).toBe(false);
  });

  it("checks the `.code` property rather than the error's class, since Metro can bundle firebase/app's FirebaseError as a different class identity than the one firebase/auth actually throws", () => {
    class SomeOtherErrorClass extends Error {
      code = "auth/invalid-credential";
    }
    expect(isFirebaseAuthError(new SomeOtherErrorClass(), "auth/invalid-credential")).toBe(true);
  });

  it("is false for a plain Error or non-error value with no code", () => {
    expect(isFirebaseAuthError(new Error("auth/invalid-credential"), "auth/invalid-credential")).toBe(false);
    expect(isFirebaseAuthError(null, "auth/invalid-credential")).toBe(false);
  });
});

describe("getLinkedProviderLabel", () => {
  it("calls the getSignInMethods Cloud Function with the given email", async () => {
    mockGetSignInMethodsCallable.mockResolvedValue({ data: { providers: [] } });

    await getLinkedProviderLabel("a@b.com");

    expect(mockHttpsCallable).toHaveBeenCalledWith({ __fake: "functions" }, "getSignInMethods");
    expect(mockGetSignInMethodsCallable).toHaveBeenCalledWith({ email: "a@b.com" });
  });

  it("maps a google.com provider to the label \"Google\"", async () => {
    mockGetSignInMethodsCallable.mockResolvedValue({ data: { providers: ["google.com"] } });
    await expect(getLinkedProviderLabel("a@b.com")).resolves.toBe("Google");
  });

  it("maps an apple.com provider to the label \"Apple\"", async () => {
    mockGetSignInMethodsCallable.mockResolvedValue({ data: { providers: ["apple.com"] } });
    await expect(getLinkedProviderLabel("a@b.com")).resolves.toBe("Apple");
  });

  it("resolves null when the only provider is password (or there are none)", async () => {
    mockGetSignInMethodsCallable.mockResolvedValue({ data: { providers: ["password"] } });
    await expect(getLinkedProviderLabel("a@b.com")).resolves.toBeNull();

    mockGetSignInMethodsCallable.mockResolvedValue({ data: { providers: [] } });
    await expect(getLinkedProviderLabel("a@b.com")).resolves.toBeNull();
  });
});
