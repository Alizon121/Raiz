import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import DeleteAccountScreen from "../DeleteAccountScreen";

const mockDeleteAccount = jest.fn();
jest.mock("../../auth/authService", () => ({
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(cleanup);

async function renderScreen() {
  await act(async () => {
    render(<DeleteAccountScreen />);
  });
}

test("the delete button is disabled until the user types the confirmation word", async () => {
  await renderScreen();
  expect(screen.getByText("Delete My Account")).toBeDisabled();

  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("DELETE"), "delete");
  });
  expect(screen.getByText("Delete My Account")).toBeDisabled();

  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("DELETE"), "DELETE");
  });
  expect(screen.getByText("Delete My Account")).toBeEnabled();
});

test("tapping the enabled delete button calls deleteAccount", async () => {
  mockDeleteAccount.mockResolvedValue(undefined);
  await renderScreen();

  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("DELETE"), "DELETE");
  });
  await act(async () => {
    fireEvent.press(screen.getByText("Delete My Account"));
  });

  expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
});

test("shows an error message and re-enables the button when deletion fails", async () => {
  mockDeleteAccount.mockRejectedValue(new Error("network error"));
  await renderScreen();

  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText("DELETE"), "DELETE");
  });
  await act(async () => {
    fireEvent.press(screen.getByText("Delete My Account"));
  });

  expect(screen.getByText(/Something went wrong/)).toBeTruthy();
  expect(screen.getByText("Delete My Account")).toBeEnabled();
});
