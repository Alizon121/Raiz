import { CROP_SEED } from "./crops.seed.js";
import { writeDryRun, writeToFirestore } from "./firestore.js";
import { buildAllCropDocs } from "./transform.js";

try {
  process.loadEnvFile(); // loads ./.env if present; no-op (throws, caught here) otherwise
} catch {
  // no .env file — fine, env vars may be set another way
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const nassApiKey = process.env.QUICK_STATS_KEY;

  const docs = await buildAllCropDocs(CROP_SEED, nassApiKey);

  if (dryRun) {
    await writeDryRun(docs);
  } else {
    await writeToFirestore(docs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
