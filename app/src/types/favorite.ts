// Mirrors users/{userId}/favorites/{cropId}, the same shape as
// ScanHistoryEntry (see scanHistory.ts) but without plu/scannedAt: a
// favorite tracks the crop itself, not a specific scan.
export interface FavoriteEntry {
  id: string;
  cropId: string;
  cropName: string;
  imageUrl: string | null;
  favoritedAt: Date;
}
