jest.mock("../../firebase/config", () => ({ db: { __fake: "db" } }));

const mockCollection = jest.fn((...args: unknown[]) => ({ __fake: "collectionRef", args }));
const mockDoc = jest.fn((collectionRef: unknown, id: string) => ({ __fake: "docRef", collectionRef, id }));
const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockOrderBy = jest.fn((field: string, direction: string) => ({ __fake: "orderBy", field, direction }));
const mockQuery = jest.fn((...args: unknown[]) => ({ __fake: "query", args }));
const mockServerTimestamp = jest.fn(() => ({ __fake: "serverTimestamp" }));

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string])),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...(args as [string, string])),
  query: (...args: unknown[]) => mockQuery(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

import { addScanHistoryEntry, getScanHistory } from "../scanHistory";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("addScanHistoryEntry", () => {
  test("writes to users/{userId}/scanHistory, keyed by cropId, with a server timestamp", async () => {
    await addScanHistoryEntry("user-1", { cropId: "apple", cropName: "Apples", plu: "4131" });

    expect(mockCollection).toHaveBeenCalledWith({ __fake: "db" }, "users", "user-1", "scanHistory");
    expect(mockDoc).toHaveBeenCalledWith({ __fake: "collectionRef", args: [{ __fake: "db" }, "users", "user-1", "scanHistory"] }, "apple");
    expect(mockSetDoc).toHaveBeenCalledWith(
      { __fake: "docRef", collectionRef: { __fake: "collectionRef", args: [{ __fake: "db" }, "users", "user-1", "scanHistory"] }, id: "apple" },
      { cropId: "apple", cropName: "Apples", plu: "4131", scannedAt: { __fake: "serverTimestamp" } },
    );
  });

  test("re-scanning the same crop writes to the same doc rather than a new one, even with a different PLU variant", async () => {
    await addScanHistoryEntry("user-1", { cropId: "apple", cropName: "Apples", plu: "4131" });
    await addScanHistoryEntry("user-1", { cropId: "apple", cropName: "Apples", plu: "4130" });

    expect(mockDoc.mock.calls[0][1]).toBe("apple");
    expect(mockDoc.mock.calls[1][1]).toBe("apple");
    expect(mockSetDoc).toHaveBeenCalledTimes(2);
  });
});

describe("getScanHistory", () => {
  test("queries the user's scanHistory ordered most-recent-first", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    await getScanHistory("user-1");

    expect(mockCollection).toHaveBeenCalledWith({ __fake: "db" }, "users", "user-1", "scanHistory");
    expect(mockOrderBy).toHaveBeenCalledWith("scannedAt", "desc");
  });

  test("maps docs into ScanHistoryEntry, converting the Timestamp to a Date", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "scan-1",
          data: () => ({
            cropId: "apple",
            cropName: "Apples",
            plu: "4131",
            scannedAt: { toDate: () => new Date("2026-01-15T00:00:00Z") },
          }),
        },
      ],
    });

    const result = await getScanHistory("user-1");

    expect(result).toEqual([
      { id: "scan-1", cropId: "apple", cropName: "Apples", plu: "4131", scannedAt: new Date("2026-01-15T00:00:00Z") },
    ]);
  });

  test("falls back to the current time when scannedAt hasn't resolved yet", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: "scan-1", data: () => ({ cropId: "apple", cropName: "Apples", plu: "4131", scannedAt: null }) }],
    });

    const result = await getScanHistory("user-1");

    expect(result[0]?.scannedAt).toBeInstanceOf(Date);
  });
});
