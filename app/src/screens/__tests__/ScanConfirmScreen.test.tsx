import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import ScanConfirmScreen from "../ScanConfirmScreen";

const mockLookupCropByPlu = jest.fn();
jest.mock("../../services/cropLookup", () => ({
  lookupCropByPlu: (...args: unknown[]) => mockLookupCropByPlu(...args),
}));

const mockAddScanHistoryEntry = jest.fn();
jest.mock("../../services/scanHistory", () => ({
  addScanHistoryEntry: (...args: unknown[]) => mockAddScanHistoryEntry(...args),
}));

const mockUseAuth = jest.fn();
jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const navigation = { navigate: mockNavigate, replace: mockReplace } as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { uid: "user-1" } });
  mockAddScanHistoryEntry.mockResolvedValue(undefined);
});
afterEach(cleanup);

async function renderScreen(plu: string) {
  await act(async () => {
    render(<ScanConfirmScreen navigation={navigation} route={{ params: { plu } } as never} />);
  });
}

test("shows a loading state before the lookup resolves", async () => {
  mockLookupCropByPlu.mockReturnValue(new Promise(() => {})); // never resolves
  await renderScreen("4131");
  expect(screen.queryByText("Is that right?")).toBeNull();
});

test("when the crop is found, shows the name for confirmation and offers Yes/No", async () => {
  mockLookupCropByPlu.mockResolvedValue({ cropId: "apple", cropName: "Apples" });
  await renderScreen("4131");

  expect(screen.getByText("4131")).toBeTruthy();
  expect(screen.getByText("Apples")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Yes, that's right"));
  });
  expect(mockReplace).toHaveBeenCalledWith("ProduceDetail", { cropId: "apple" });
  expect(mockAddScanHistoryEntry).toHaveBeenCalledWith("user-1", { cropId: "apple", cropName: "Apples", plu: "4131" });
});

test("confirming still navigates even if logging the scan history entry fails", async () => {
  mockLookupCropByPlu.mockResolvedValue({ cropId: "apple", cropName: "Apples" });
  mockAddScanHistoryEntry.mockRejectedValue(new Error("offline"));
  await renderScreen("4131");

  await act(async () => {
    fireEvent.press(screen.getByText("Yes, that's right"));
  });
  expect(mockReplace).toHaveBeenCalledWith("ProduceDetail", { cropId: "apple" });
});

test("confirming without a signed-in user skips logging but still navigates", async () => {
  mockUseAuth.mockReturnValue({ user: null });
  mockLookupCropByPlu.mockResolvedValue({ cropId: "apple", cropName: "Apples" });
  await renderScreen("4131");

  await act(async () => {
    fireEvent.press(screen.getByText("Yes, that's right"));
  });
  expect(mockAddScanHistoryEntry).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("ProduceDetail", { cropId: "apple" });
});

test("tapping \"No, enter it manually\" navigates to ManualEntry instead of confirming", async () => {
  mockLookupCropByPlu.mockResolvedValue({ cropId: "apple", cropName: "Apples" });
  await renderScreen("4131");

  await act(async () => {
    fireEvent.press(screen.getByText("No, enter it manually"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ManualEntry");
  expect(mockReplace).not.toHaveBeenCalled();
});

test("when no crop matches the PLU, shows a not-found state with recovery options", async () => {
  mockLookupCropByPlu.mockResolvedValue(null);
  await renderScreen("0000");

  expect(screen.getByText("We don't have data for that yet")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Enter a different code"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("ManualEntry");
});

test("when the lookup itself fails, shows an error state with a retry option", async () => {
  mockLookupCropByPlu.mockRejectedValue(new Error("network down"));
  await renderScreen("4131");

  expect(screen.getByText("Something went wrong")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByText("Back to scan"));
  });
  expect(mockNavigate).toHaveBeenCalledWith("Scan");
});
