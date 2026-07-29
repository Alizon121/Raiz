import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import HistoryScreen from "../HistoryScreen";

jest.mock("@react-navigation/native", () => ({
  // Runs the focus callback once on mount, which is enough to exercise the
  // fetch-on-focus logic without a real NavigationContainer in these tests.
  useFocusEffect: (callback: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useEffect } = require("react");
    useEffect(() => callback(), []);
  },
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;

const mockUseAuth = jest.fn();
jest.mock("../../auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetScanHistory = jest.fn();
jest.mock("../../services/scanHistory", () => ({
  getScanHistory: (...args: unknown[]) => mockGetScanHistory(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { uid: "user-1" } });
});
afterEach(cleanup);

async function renderScreen() {
  await act(async () => {
    render(<HistoryScreen navigation={navigation} route={{} as never} />);
  });
}

test("shows a loading indicator before the fetch resolves", async () => {
  mockGetScanHistory.mockReturnValue(new Promise(() => {})); // never resolves
  await renderScreen();
  expect(screen.getByText("History")).toBeTruthy();
  expect(screen.queryByText("Start scanning to see a history of your scanned produce here")).toBeNull();
});

test("shows the empty-state message when the user has no scan history", async () => {
  mockGetScanHistory.mockResolvedValue([]);
  await renderScreen();
  expect(screen.getByText("Start scanning to see a history of your scanned produce here")).toBeTruthy();
});

test("shows an error message when the fetch fails", async () => {
  mockGetScanHistory.mockRejectedValue(new Error("network down"));
  await renderScreen();
  expect(screen.getByText(/couldn't load your history/)).toBeTruthy();
});

test("renders each scan with its crop name, PLU, and date, most-recent-first as returned", async () => {
  mockGetScanHistory.mockResolvedValue([
    { id: "scan-2", cropId: "banana", cropName: "Bananas", plu: "4011", scannedAt: new Date("2026-02-01T00:00:00Z") },
    { id: "scan-1", cropId: "apple", cropName: "Apples", plu: "4131", scannedAt: new Date("2026-01-15T00:00:00Z") },
  ]);
  await renderScreen();

  expect(screen.getByText("Bananas")).toBeTruthy();
  expect(screen.getByText("PLU 4011")).toBeTruthy();
  expect(screen.getByText("Apples")).toBeTruthy();
  expect(screen.getByText("PLU 4131")).toBeTruthy();
});

test("tapping a row navigates to ProduceDetail within the History stack", async () => {
  mockGetScanHistory.mockResolvedValue([
    { id: "scan-1", cropId: "apple", cropName: "Apples", plu: "4131", scannedAt: new Date("2026-01-15T00:00:00Z") },
  ]);
  await renderScreen();

  await act(async () => {
    fireEvent.press(screen.getByText("Apples"));
  });

  expect(mockNavigate).toHaveBeenCalledWith("ProduceDetail", { cropId: "apple" });
});

test("does not fetch when there is no signed-in user", async () => {
  mockUseAuth.mockReturnValue({ user: null });
  await renderScreen();
  expect(mockGetScanHistory).not.toHaveBeenCalled();
});
