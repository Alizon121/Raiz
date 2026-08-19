import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type { FavoriteEntry } from "../types/favorite";

function favoritesCollection(userId: string) {
  return collection(db, "users", userId, "favorites");
}

/** Keyed by cropId, so a crop can only be favorited once — re-favoriting is a no-op overwrite. */
export async function addFavorite(
  userId: string,
  entry: { cropId: string; cropName: string; imageUrl: string | null },
): Promise<void> {
  await setDoc(doc(favoritesCollection(userId), entry.cropId), { ...entry, favoritedAt: serverTimestamp() });
}

export async function removeFavorite(userId: string, cropId: string): Promise<void> {
  await deleteDoc(doc(favoritesCollection(userId), cropId));
}

export async function isFavorited(userId: string, cropId: string): Promise<boolean> {
  const snap = await getDoc(doc(favoritesCollection(userId), cropId));
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
      favoritedAt: Timestamp | null;
    };
    return {
      id: docSnap.id,
      cropId: data.cropId,
      cropName: data.cropName,
      imageUrl: data.imageUrl ?? null,
      // favoritedAt can briefly be null: serverTimestamp() resolves once the
      // write reaches the server, mirroring getScanHistory's same handling.
      favoritedAt: data.favoritedAt ? data.favoritedAt.toDate() : new Date(),
    };
  });
}
