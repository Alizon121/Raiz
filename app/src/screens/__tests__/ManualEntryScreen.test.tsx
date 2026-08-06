import { act, fireEvent, render, screen } from "@testing-library/react-native";
import ManualEntryScreen from "../ManualEntryScreen";

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;

beforeEach(() => {
  jest.clearAllMocks();
});

async function renderScreen() {
  await act(async () => {
    render(<ManualEntryScreen navigation={navigation} route={{} as never} />);
  });
}

async function typeText(text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("e.g. 4131"), text);
  });
}

test("submit is a no-op for an invalid PLU (wrong length), and shows an inline error", async () => {
  await renderScreen();
  await typeText("41");

  expect(screen.getByText("PLU codes are 4 or 5 digits.")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Look it up"));
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("no error shown before the user has typed anything", async () => {
  await renderScreen();
  expect(screen.queryByText("PLU codes are 4 or 5 digits.")).toBeNull();
});

test("a valid 4-digit PLU navigates to ScanConfirm with the entered code", async () => {
  await renderScreen();
  await typeText("4131");

  await act(async () => {
    fireEvent.press(screen.getByText("Look it up"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ScanConfirm", { plu: "4131" });
});

test("a valid 5-digit PLU is also accepted", async () => {
  await renderScreen();
  await typeText("94131");

  await act(async () => {
    fireEvent.press(screen.getByText("Look it up"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ScanConfirm", { plu: "94131" });
});
