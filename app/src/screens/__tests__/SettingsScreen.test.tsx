import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import { AdsConsent } from "react-native-google-mobile-ads";
import SettingsScreen from "../SettingsScreen";
import { PremiumProvider } from "../../iap/PremiumContext";

const mockGetConsentInfo = AdsConsent.getConsentInfo as jest.Mock;
const mockShowPrivacyOptionsForm = AdsConsent.showPrivacyOptionsForm as jest.Mock;

const mockResetConsentForTesting = jest.fn();
jest.mock("../../ads/initAds", () => ({
  resetConsentForTesting: (...args: unknown[]) => mockResetConsentForTesting(...args),
}));

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
  jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  mockGetConsentInfo.mockResolvedValue({ privacyOptionsRequirementStatus: "NOT_REQUIRED" });
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

test("tapping \"Privacy Policy\" opens the GitHub-hosted policy doc", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Privacy Policy"));
  });
  expect(Linking.openURL).toHaveBeenCalledWith("https://github.com/Alizon121/Raiz/blob/main/PRIVACY_POLICY.md");
});

test("hides Ad Privacy Options when the UMP SDK reports it isn't required for this device", async () => {
  await renderScreen();
  expect(screen.queryByText("Ad Privacy Options")).toBeNull();
});

test("shows Ad Privacy Options, and opens the UMP form when tapped, when the UMP SDK reports it's required", async () => {
  mockGetConsentInfo.mockResolvedValue({ privacyOptionsRequirementStatus: "REQUIRED" });
  await renderScreen();

  await act(async () => {
    fireEvent.press(screen.getByText("Ad Privacy Options"));
  });
  expect(mockShowPrivacyOptionsForm).toHaveBeenCalledTimes(1);
});

test("tapping \"Sign out\" signs the user out", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Sign out"));
  });
  expect(mockSignOut).toHaveBeenCalledTimes(1);
});

test("tapping \"Delete Account\" navigates to the DeleteAccount screen within the Settings stack", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Delete Account"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("DeleteAccount");
});

test("tapping \"Reset ad consent (dev only)\" clears and re-gathers UMP consent", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Reset ad consent (dev only)"));
  });
  expect(mockResetConsentForTesting).toHaveBeenCalledTimes(1);
});
