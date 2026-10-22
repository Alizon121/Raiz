import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type { FavoriteEntry } from "../types/favorite";

function favoritesCollection(userId: string) {
  return collection(db, "users", userId, "favorites");
}

/**
 * Conventional favorites keep the bare cropId as their doc ID (so existing
 * favorites are untouched); the organic variant gets a suffix, which makes
 * organic and conventional two independent favorites of the same crop.
 */
export function favoriteDocId(cropId: string, organic: boolean): string {
  return organic ? `${cropId}__organic` : cropId;
}

/** Re-favoriting the same crop + variant is a no-op overwrite. */
export async function addFavorite(
  userId: string,
  entry: { cropId: string; cropName: string; imageUrl: string | null; organic?: boolean },
): Promise<void> {
  const organic = entry.organic ?? false;
  await setDoc(doc(favoritesCollection(userId), favoriteDocId(entry.cropId, organic)), {
    ...entry,
    organic,
    favoritedAt: serverTimestamp(),
  });
}

export async function removeFavorite(userId: string, cropId: string, organic = false): Promise<void> {
  await deleteDoc(doc(favoritesCollection(userId), favoriteDocId(cropId, organic)));
}

export async function isFavorited(userId: string, cropId: string, organic = false): Promise<boolean> {
  const snap = await getDoc(doc(favoritesCollection(userId), favoriteDocId(cropId, organic)));
  return snap.exists();
}

/** Most recently favorited first. */
export async function getFavorites(userId: string): Promise<FavoriteEntry[]> {
  const q = query(favoritesCollection(userId), orderBy("favoritedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as {
      cropId: string;
      cropName: string;
      imageUrl: string | null | undefined;
      organic: boolean | undefined;
      favoritedAt: Timestamp | null;
    };
    return {
      id: docSnap.id,
      cropId: data.cropId,
      cropName: data.cropName,
      imageUrl: data.imageUrl ?? null,
      organic: data.organic ?? false, // docs saved before organic favorites existed
      // favoritedAt can briefly be null: serverTimestamp() resolves once the
      // write reaches the server, mirroring getScanHistory's same handling.
      favoritedAt: data.favoritedAt ? data.favoritedAt.toDate() : new Date(),
    };
  });
}
