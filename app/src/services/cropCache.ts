import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Crop } from "../types/crop";

const CACHE_KEY_PREFIX = "crop_cache_";

// Crop docs only change when the ETL reruns, which is infrequent — a day is
// long enough to avoid re-fetching the same crop on every History tap or
// re-scan, short enough that a data refresh shows up without reinstalling.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedEntry {
  crop: Crop;
  cachedAt: number;
}

/** Returns the cached crop if present and not expired, else null. Never throws — a cache miss/error just means "go fetch it". */
export async function getCachedCrop(cropId: string): Promise<Crop | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + cropId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedEntry;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return { ...entry.crop, lastUpdated: new Date(entry.crop.lastUpdated) };
  } catch {
    return null;
  }
}

export async function setCachedCrop(crop: Crop): Promise<void> {
  const entry: CachedEntry = { crop, cachedAt: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY_PREFIX + crop.cropId, JSON.stringify(entry));
}
