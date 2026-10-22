jest.mock("../../firebase/config", () => ({ db: { __fake: "db" } }));

const mockCollection = jest.fn((...args: unknown[]) => ({ __fake: "collectionRef", args }));
const mockDoc = jest.fn((_col: unknown, id: string) => ({ __fake: "docRef", id }));
const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockDeleteDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();

jest.mock("firebase/firestore", () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string])),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  orderBy: (...args: unknown[]) => ({ __fake: "orderBy", args }),
  query: (...args: unknown[]) => ({ __fake: "query", args }),
  serverTimestamp: () => "SERVER_TS",
}));

import { addFavorite, favoriteDocId, getFavorites, isFavorited, removeFavorite } from "../favorites";

beforeEach(() => jest.clearAllMocks());

test("favoriteDocId keeps the bare cropId for conventional and suffixes organic", () => {
  expect(favoriteDocId("apple", false)).toBe("apple");
  expect(favoriteDocId("apple", true)).toBe("apple__organic");
});

test("organic and conventional favorites of the same crop are written to different docs", async () => {
  await addFavorite("u1", { cropId: "apple", cropName: "Apples", imageUrl: null });
  await addFavorite("u1", { cropId: "apple", cropName: "Apples", imageUrl: null, organic: true });

  expect(mockDoc.mock.calls.map((c) => c[1])).toEqual(["apple", "apple__organic"]);
  expect(mockSetDoc.mock.calls[0][1]).toMatchObject({ organic: false });
  expect(mockSetDoc.mock.calls[1][1]).toMatchObject({ organic: true });
});

test("removeFavorite and isFavorited target the variant's own doc", async () => {
  mockGetDoc.mockResolvedValue({ exists: () => true });
  await removeFavorite("u1", "apple", true);
  await isFavorited("u1", "apple");
  expect(mockDoc.mock.calls.map((c) => c[1])).toEqual(["apple__organic", "apple"]);
});

test("getFavorites returns organic flag, defaulting to false for docs saved before organic existed", async () => {
  const ts = { toDate: () => new Date("2026-01-01T00:00:00Z") };
  mockGetDocs.mockResolvedValue({
    docs: [
      { id: "apple__organic", data: () => ({ cropId: "apple", cropName: "Apples", imageUrl: null, organic: true, favoritedAt: ts }) },
      { id: "apple", data: () => ({ cropId: "apple", cropName: "Apples", imageUrl: null, favoritedAt: ts }) },
    ],
  });
  const result = await getFavorites("u1");
  expect(result.map((f) => [f.id, f.organic])).toEqual([
    ["apple__organic", true],
    ["apple", false],
  ]);
});
