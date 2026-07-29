import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../../firebase/config", () => ({ db: { __fake: "db" } }));

const mockCollection = jest.fn((_db, name) => ({ __fake: "collectionRef", name }));
const mockDoc = jest.fn((_db, name, id) => ({ __fake: "docRef", name, id }));
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockLimit = jest.fn((n) => ({ __fake: "limit", n }));
const mockQuery = jest.fn((...args: unknown[]) => ({ __fake: "query", args }));
const mockWhere = jest.fn((field: string, op: string, value: unknown) => ({ __fake: "where", field, op, value }));

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...(args as [unknown, string])),
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string, string])),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: (...args: unknown[]) => mockLimit(...(args as [number])),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...(args as [string, string, unknown])),
}));

import { getAllKnownPlus, getCropById, lookupCropByPlu } from "../cropLookup";

const RAW_APPLE_DOC = {
  cropName: "Apples",
  plu: ["4131", "4130"],
  commonAliases: ["apple"],
  chemicalUse: null,
  registeredProducts: null,
  residueData: null,
  residueReductionTips: ["Rinse under running water."],
  lastUpdated: { toDate: () => new Date("2026-01-15T00:00:00Z") },
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("lookupCropByPlu", () => {
  test("queries the crops collection with an array-contains clause on the given PLU, limited to 1", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await lookupCropByPlu("4131");

    expect(mockCollection).toHaveBeenCalledWith({ __fake: "db" }, "crops");
    expect(mockWhere).toHaveBeenCalledWith("plu", "array-contains", "4131");
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  test("returns null when no crop matches the PLU", async () => {
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    const result = await lookupCropByPlu("0000");
    expect(result).toBeNull();
  });

  test("maps the matched doc into a Crop, including the doc ID and a converted Date", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: "apple", data: () => RAW_APPLE_DOC }],
    });

    const result = await lookupCropByPlu("4131");

    expect(result).toEqual({
      cropId: "apple",
      cropName: "Apples",
      plu: ["4131", "4130"],
      commonAliases: ["apple"],
      chemicalUse: null,
      registeredProducts: null,
      residueData: null,
      residueReductionTips: ["Rinse under running water."],
      lastUpdated: new Date("2026-01-15T00:00:00Z"),
    });
  });

  test("caches the crop it finds, so a later getCropById for the same ID skips Firestore", async () => {
    mockGetDocs.mockResolvedValue({ empty: false, docs: [{ id: "apple", data: () => RAW_APPLE_DOC }] });
    await lookupCropByPlu("4131");

    const result = await getCropById("apple");
    expect(result?.cropName).toBe("Apples");
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});

describe("getCropById", () => {
  test("returns null when the document doesn't exist", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await getCropById("nonexistent");
    expect(result).toBeNull();
  });

  test("returns the mapped Crop when the document exists", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => RAW_APPLE_DOC });
    const result = await getCropById("apple");
    expect(result?.cropId).toBe("apple");
    expect(result?.cropName).toBe("Apples");
    expect(mockDoc).toHaveBeenCalledWith({ __fake: "db" }, "crops", "apple");
  });

  test("a second call for the same crop ID is served from the cache, without hitting Firestore again", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => RAW_APPLE_DOC });

    await getCropById("apple");
    mockGetDoc.mockClear();
    const second = await getCropById("apple");

    expect(second?.cropName).toBe("Apples");
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  test("a lookup that finds nothing is not cached, so it re-queries Firestore next time", async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    await getCropById("nonexistent");
    mockGetDoc.mockClear();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => RAW_APPLE_DOC });
    const second = await getCropById("nonexistent");

    expect(mockGetDoc).toHaveBeenCalledTimes(1);
    expect(second?.cropName).toBe("Apples");
  });
});

describe("getAllKnownPlus", () => {
  // cachedKnownPlus is module-level state that persists across tests (not
  // reset by clearAllMocks), so flattening and caching are covered in one
  // test rather than two — a second test calling this fresh would just see
  // the first test's cached result and never call the mock at all.
  test("flattens PLU codes across every crop doc into one Set, and caches across calls", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { data: () => ({ plu: ["4131", "4130"] }) },
        { data: () => ({ plu: ["4072"] }) },
      ],
    });

    const first = await getAllKnownPlus();
    expect(first).toEqual(new Set(["4131", "4130", "4072"]));

    const second = await getAllKnownPlus();
    expect(second).toBe(first); // same Set instance — no re-fetch
    expect(mockGetDocs).toHaveBeenCalledTimes(1);
  });
});
