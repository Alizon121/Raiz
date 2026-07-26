import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import EmailAuthScreen from "../EmailAuthScreen";

const mockSignInWithEmail = jest.fn();
const mockSignUpWithEmail = jest.fn();
jest.mock("../../auth/authService", () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...args),
}));

const mockGoBack = jest.fn();
const navigation = { goBack: mockGoBack } as never;

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(cleanup);

async function renderScreen(mode: "sign-in" | "sign-up") {
  await act(async () => {
    render(<EmailAuthScreen navigation={navigation} route={{ params: { mode } } as never} />);
  });
}

async function typeText(placeholder: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);
  });
}

async function pressSubmit() {
  await act(async () => {
    fireEvent.press(screen.getByTestId("email-auth-submit"));
  });
}

async function fillAndSubmit(email: string, password: string) {
  await typeText("Email", email);
  await typeText("Password", password);
  await pressSubmit();
}

test("renders in sign-in mode when navigated to with mode: sign-in", async () => {
  await renderScreen("sign-in");
  expect(screen.getByTestId("email-auth-submit")).toBeTruthy();
  expect(screen.queryByText("Create an account")).toBeNull();
});

test("renders in sign-up mode when navigated to with mode: sign-up", async () => {
  await renderScreen("sign-up");
  expect(screen.getByText("Create an account")).toBeTruthy();
});

test("submit is a no-op while email or password is empty, and fires once both are filled", async () => {
  await renderScreen("sign-in");

  // Empty fields: pressing submit must not call through to Firebase.
  await pressSubmit();
  expect(mockSignInWithEmail).not.toHaveBeenCalled();

  // Only email filled: still blocked.
  await typeText("Email", "a@b.com");
  await pressSubmit();
  expect(mockSignInWithEmail).not.toHaveBeenCalled();

  // Both filled: now it goes through.
  await typeText("Password", "hunter2");
  await pressSubmit();
  expect(mockSignInWithEmail).toHaveBeenCalledWith("a@b.com", "hunter2");
});

test("submitting in sign-in mode calls signInWithEmail, not signUpWithEmail", async () => {
  mockSignInWithEmail.mockResolvedValue(undefined);
  await renderScreen("sign-in");
  await fillAndSubmit("a@b.com", "hunter2");
  expect(mockSignInWithEmail).toHaveBeenCalledWith("a@b.com", "hunter2");
  expect(mockSignUpWithEmail).not.toHaveBeenCalled();
});

test("submitting in sign-up mode calls signUpWithEmail, not signInWithEmail", async () => {
  mockSignUpWithEmail.mockResolvedValue(undefined);
  await renderScreen("sign-up");
  await fillAndSubmit("new@b.com", "hunter2");
  expect(mockSignUpWithEmail).toHaveBeenCalledWith("new@b.com", "hunter2");
  expect(mockSignInWithEmail).not.toHaveBeenCalled();
});

test("a failed sign-in surfaces the error message", async () => {
  mockSignInWithEmail.mockRejectedValue(new Error("wrong password"));
  await renderScreen("sign-in");
  await fillAndSubmit("a@b.com", "wrong");
  expect(screen.getByText("wrong password")).toBeTruthy();
});

test("toggling \"Need an account? Sign up\" switches mode locally without navigating", async () => {
  await renderScreen("sign-in");
  await act(async () => {
    fireEvent.press(screen.getByText("Need an account? Sign up"));
  });
  expect(screen.getByText("Create an account")).toBeTruthy();
});

test("tapping Back calls navigation.goBack", async () => {
  await renderScreen("sign-in");
  await act(async () => {
    fireEvent.press(screen.getByText("‹ Back"));
  });
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});
