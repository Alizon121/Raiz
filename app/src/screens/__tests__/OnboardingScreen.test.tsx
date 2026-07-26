import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import OnboardingScreen, { hasSeenOnboarding, resetOnboarding } from "../OnboardingScreen";

const SLIDE_TITLES = [
  "Know What's On Your Produce",
  "Scan the PLU Sticker",
  "Build Your History",
  "Data, Not Judgment",
];

beforeEach(async () => {
  await AsyncStorage.clear();
});

async function tapContinue() {
  await act(async () => {
    fireEvent.press(screen.getByText(/^(Continue|Let's Get Started)$/));
  });
}

test("starts on the first slide", async () => {
  await act(async () => {
    render(<OnboardingScreen onDone={jest.fn()} />);
  });
  expect(screen.getByText(SLIDE_TITLES[0])).toBeTruthy();
  expect(screen.getByText("Skip")).toBeTruthy();
});

test("Continue advances through all four slides in order", async () => {
  await act(async () => {
    render(<OnboardingScreen onDone={jest.fn()} />);
  });

  for (let i = 1; i < SLIDE_TITLES.length; i++) {
    await tapContinue();
    expect(screen.getByText(SLIDE_TITLES[i])).toBeTruthy();
  }
});

test("Skip is hidden and the button reads \"Let's Get Started\" only on the last slide", async () => {
  await act(async () => {
    render(<OnboardingScreen onDone={jest.fn()} />);
  });

  for (let i = 1; i < SLIDE_TITLES.length; i++) {
    expect(screen.queryByText("Skip")).toBeTruthy();
    await tapContinue();
  }

  expect(screen.queryByText("Skip")).toBeNull();
  expect(screen.getByText("Let's Get Started")).toBeTruthy();
});

test("tapping Skip marks onboarding as seen and calls onDone, from any non-last slide", async () => {
  const onDone = jest.fn();
  await act(async () => {
    render(<OnboardingScreen onDone={onDone} />);
  });

  await act(async () => {
    fireEvent.press(screen.getByText("Skip"));
  });

  expect(onDone).toHaveBeenCalledTimes(1);
  await expect(hasSeenOnboarding()).resolves.toBe(true);
});

test("tapping \"Let's Get Started\" on the last slide also marks onboarding as seen and calls onDone", async () => {
  const onDone = jest.fn();
  await act(async () => {
    render(<OnboardingScreen onDone={onDone} />);
  });

  for (let i = 1; i < SLIDE_TITLES.length; i++) {
    await tapContinue();
  }
  await tapContinue(); // final tap = "Let's Get Started"

  expect(onDone).toHaveBeenCalledTimes(1);
  await expect(hasSeenOnboarding()).resolves.toBe(true);
});

describe("hasSeenOnboarding / resetOnboarding", () => {
  test("hasSeenOnboarding is false by default", async () => {
    await expect(hasSeenOnboarding()).resolves.toBe(false);
  });

  test("resetOnboarding clears a previously-seen flag", async () => {
    await AsyncStorage.setItem("onboarding_seen", "true");
    await expect(hasSeenOnboarding()).resolves.toBe(true);

    await resetOnboarding();
    await expect(hasSeenOnboarding()).resolves.toBe(false);
  });
});
