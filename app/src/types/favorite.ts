// Mirrors users/{userId}/favorites/{docId} (docId = cropId, or cropId__organic
// for the organic variant; see favoriteDocId), the same shape as
// ScanHistoryEntry (see scanHistory.ts) but without plu/scannedAt: a
// favorite tracks the crop itself, not a specific scan.
export interface FavoriteEntry {
  id: string;
  cropId: string;
  cropName: string;
  imageUrl: string | null;
  /** True when favorited from an organic scan; organic and conventional are separate favorites. */
  organic: boolean;
  favoritedAt: Date;
}
