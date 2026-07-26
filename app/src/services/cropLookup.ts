import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Crop, CropDoc } from "../types/crop";

function toCrop(cropId: string, data: Record<string, unknown>): Crop {
  const raw = data as unknown as CropDoc & { lastUpdated: { toDate(): Date } };
  return {
    cropId,
    cropName: raw.cropName,
    plu: raw.plu,
    commonAliases: raw.commonAliases,
    chemicalUse: raw.chemicalUse,
    registeredProducts: raw.registeredProducts,
    residueData: raw.residueData,
    residueReductionTips: raw.residueReductionTips,
    lastUpdated: raw.lastUpdated.toDate(),
  };
}

/**
 * Looks up a crop by a scanned/typed PLU code. `plu` is a Firestore array
 * field (build spec's `crops/{cropId}.plu: string[]`), so this is an
 * array-contains query — no composite index required for a single
 * array-contains clause.
 */
export async function lookupCropByPlu(plu: string): Promise<Crop | null> {
  const q = query(collection(db, "crops"), where("plu", "array-contains", plu), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return toCrop(docSnap.id, docSnap.data());
}

/** Looks up a crop directly by its Firestore document ID (e.g. from History). */
export async function getCropById(cropId: string): Promise<Crop | null> {
  const snapshot = await getDoc(doc(db, "crops", cropId));
  if (!snapshot.exists()) return null;
  return toCrop(cropId, snapshot.data());
}

let cachedKnownPlus: Promise<Set<string>> | null = null;

/**
 * All PLU codes across every crop we have data for. Used to disambiguate
 * OCR noise (a PLU sticker's font/price/weight digits) — a 4-5 digit read
 * that matches a code we actually track is a much stronger signal than an
 * arbitrary one. The `crops` collection is small (single-digit crop count
 * today), so fetching it whole and caching for the session is cheap;
 * revisit with a dedicated index if the catalog grows substantially.
 */
export async function getAllKnownPlus(): Promise<Set<string>> {
  if (!cachedKnownPlus) {
    cachedKnownPlus = getDocs(collection(db, "crops")).then(
      (snapshot) => new Set(snapshot.docs.flatMap((d) => (d.data() as CropDoc).plu)),
    );
  }
  return cachedKnownPlus;
}
