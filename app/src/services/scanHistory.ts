import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, type Timestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import type { ScanHistoryEntry } from "../types/scanHistory";

function scanHistoryCollection(userId: string) {
  return collection(db, "users", userId, "scanHistory");
}

export async function addScanHistoryEntry(
  userId: string,
  entry: { cropId: string; cropName: string; plu: string },
): Promise<void> {
  await addDoc(scanHistoryCollection(userId), { ...entry, scannedAt: serverTimestamp() });
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
