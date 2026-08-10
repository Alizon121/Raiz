// Mirrors the build spec's users/{userId}/scanHistory/{scanId} schema (see
// firestore.rules). Denormalizes cropName + plu from the crops doc at scan
// time so History can render without an extra lookup per row.
export interface ScanHistoryEntry {
  id: string;
  cropId: string;
  cropName: string;
  plu: string;
  imageUrl: string | null;
  scannedAt: Date;
}
