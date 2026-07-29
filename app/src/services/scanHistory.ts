import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type { ScanHistoryEntry } from "../types/scanHistory";

function scanHistoryCollection(userId: string) {
  return collection(db, "users", userId, "scanHistory");
}

/**
 * Keyed by cropId (not an auto-generated ID), so re-scanning a product you've
 * already scanned overwrites the same doc — bumping it to the top with a
 * fresh scannedAt — instead of piling up duplicate rows for the same crop.
 * A crop can have several PLUs (e.g. different apple varieties' stickers
 * all mapping to cropId "apple"); those are deliberately treated as the
 * same product for history purposes.
 */
export async function addScanHistoryEntry(
  userId: string,
  entry: { cropId: string; cropName: string; plu: string },
): Promise<void> {
  await setDoc(doc(scanHistoryCollection(userId), entry.cropId), { ...entry, scannedAt: serverTimestamp() });
}

/** Most recent scans first. */
export async function getScanHistory(userId: string): Promise<ScanHistoryEntry[]> {
  const q = query(scanHistoryCollection(userId), orderBy("scannedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as { cropId: string; cropName: string; plu: string; scannedAt: Timestamp | null };
    return {
      id: docSnap.id,
      cropId: data.cropId,
      cropName: data.cropName,
      plu: data.plu,
      // scannedAt can briefly be null: serverTimestamp() resolves once the
      // write reaches the server, so a doc read back immediately after being
      // written offline may not have it yet.
      scannedAt: data.scannedAt ? data.scannedAt.toDate() : new Date(),
    };
  });
}
