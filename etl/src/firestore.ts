import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CropDoc } from "./types.js";

/** Dry-run: write each crop doc as pretty JSON instead of touching Firestore. */
export async function writeDryRun(docs: Record<string, CropDoc>): Promise<void> {
  const outDir = path.resolve(process.cwd(), "output");
  await mkdir(outDir, { recursive: true });
  for (const [cropId, doc] of Object.entries(docs)) {
    await writeFile(path.join(outDir, `${cropId}.json`), JSON.stringify(doc, null, 2));
  }
  console.log(`Dry run complete. Wrote ${Object.keys(docs).length} crop docs to ${outDir}/`);
}

/** Writes crop docs to the `crops` Firestore collection using firebase-admin. */
export async function writeToFirestore(docs: Record<string, CropDoc>): Promise<void> {
  const { initializeApp, applicationDefault, cert } = await import("firebase-admin/app");
  const { getFirestore, Timestamp } = await import("firebase-admin/firestore");

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const app = initializeApp({
    credential: serviceAccountPath ? cert(serviceAccountPath) : applicationDefault(),
  });
  const db = getFirestore(app);

  const batch = db.batch();
  for (const [cropId, doc] of Object.entries(docs)) {
    const ref = db.collection("crops").doc(cropId);
    batch.set(ref, { ...doc, lastUpdated: Timestamp.fromDate(new Date(doc.lastUpdated)) });
  }
  await batch.commit();

  console.log(`Wrote ${Object.keys(docs).length} crop docs to Firestore.`);
}
