import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import SettingsScreen from "../SettingsScreen";
import { PremiumProvider } from "../../iap/PremiumContext";

const mockSignOut = jest.fn();
jest.mock("../../auth/authService", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const mockUseAuth = jest.fn();
jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockResetOnboarding = jest.fn();
jest.mock("../OnboardingScreen", () => ({
  resetOnboarding: (...args: unknown[]) => mockResetOnboarding(...args),
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { email: "andrew@example.com" } });
});
afterEach(cleanup);

async function renderScreen() {
  await act(async () => {
    render(
      <PremiumProvider>
        <SettingsScreen navigation={navigation} route={{} as never} />
      </PremiumProvider>,
    );
  });
}

test("shows the signed-in user's email", async () => {
  await renderScreen();
  expect(screen.getByText("andrew@example.com")).toBeTruthy();
});

// Regression test: "About" used to be registered only under the History
// tab's stack, unreachable from here — tapping this button would silently
// no-op (or type-error, once Settings got its own properly-typed stack).
test("tapping \"About\" navigates to the About screen within the Settings stack", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("About"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("About");
});

test("tapping \"Sign out\" signs the user out", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Sign out"));
  });
  expect(mockSignOut).toHaveBeenCalledTimes(1);
});
