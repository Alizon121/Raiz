import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";
import AuthWelcomeScreen from "../AuthWelcomeScreen";

const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();
jest.mock("../../auth/authService", () => ({
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
}));

const mockIsAvailableAsync = jest.fn();
jest.mock("expo-apple-authentication", () => ({
  isAvailableAsync: () => mockIsAvailableAsync(),
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;
const route = {} as never;

const ORIGINAL_APPLE_FLAG = process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED = ORIGINAL_APPLE_FLAG;
});

async function renderScreen() {
  await act(async () => {
    render(<AuthWelcomeScreen navigation={navigation} route={route} />);
  });
}

test("Apple button is hidden when EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED is unset, regardless of platform capability", async () => {
  delete process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED;
  mockIsAvailableAsync.mockResolvedValue(true); // OS-level capability says yes...
  await renderScreen();

  // ...but the button must still be hidden, since we haven't provisioned the entitlement yet.
  expect(screen.queryByText("Continue with Apple")).toBeNull();
  expect(mockIsAvailableAsync).not.toHaveBeenCalled();
});

test("Apple button appears once EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED=true, on iOS, when the OS reports availability", async () => {
  process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED = "true";
  Platform.OS = "ios";
  mockIsAvailableAsync.mockResolvedValue(true);
  await renderScreen();

  expect(screen.getByText("Continue with Apple")).toBeTruthy();
});

test("tapping \"Sign In with Email\" navigates to EmailAuth in sign-in mode", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Sign In with Email"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("EmailAuth", { mode: "sign-in" });
});

test("tapping \"Create one\" navigates to EmailAuth in sign-up mode", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Create one"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("EmailAuth", { mode: "sign-up" });
});

test("tapping \"Continue with Google\" invokes signInWithGoogle", async () => {
  mockSignInWithGoogle.mockResolvedValue(undefined);
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Continue with Google"));
  });
  expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
});

test("a failed Google sign-in surfaces the error message instead of failing silently", async () => {
  mockSignInWithGoogle.mockRejectedValue(new Error("network unreachable"));
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Continue with Google"));
  });
  expect(screen.getByText("network unreachable")).toBeTruthy();
});
