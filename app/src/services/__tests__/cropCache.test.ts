import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCachedCrop, setCachedCrop } from "../cropCache";
import type { Crop } from "../../types/crop";

const APPLE: Crop = {
  cropId: "apple",
  cropName: "Apples",
  plu: ["4131", "4130"],
  commonAliases: ["apple"],
  chemicalUse: null,
  registeredProducts: null,
  residueData: null,
  residueReductionTips: ["Rinse under running water."],
  imageUrl: null,
  lastUpdated: new Date("2026-01-15T00:00:00Z"),
};

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

test("returns null for a crop that was never cached", async () => {
  expect(await getCachedCrop("apple")).toBeNull();
});

test("returns a cached crop, with lastUpdated restored as a real Date", async () => {
  await setCachedCrop(APPLE);
  const result = await getCachedCrop("apple");
  expect(result).toEqual(APPLE);
  expect(result?.lastUpdated).toBeInstanceOf(Date);
});

test("caches are keyed per crop ID", async () => {
  await setCachedCrop(APPLE);
  expect(await getCachedCrop("orange")).toBeNull();
});

test("treats an entry older than the TTL as a miss", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  await setCachedCrop(APPLE);

  jest.spyOn(Date, "now").mockReturnValue(1_000_000 + 25 * 60 * 60 * 1000); // 25h later
  expect(await getCachedCrop("apple")).toBeNull();
});

test("treats an entry within the TTL as a hit", async () => {
  jest.spyOn(Date, "now").mockReturnValue(1_000_000);
  await setCachedCrop(APPLE);

  jest.spyOn(Date, "now").mockReturnValue(1_000_000 + 23 * 60 * 60 * 1000); // 23h later
  expect(await getCachedCrop("apple")).toEqual(APPLE);
});

test("a corrupted cache entry is treated as a miss instead of throwing", async () => {
  await AsyncStorage.setItem("crop_cache_apple", "not valid json");
  expect(await getCachedCrop("apple")).toBeNull();
});
