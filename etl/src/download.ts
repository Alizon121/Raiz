import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.resolve(process.cwd(), ".cache");
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day; sources refresh weekly/annually at most

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

function cacheKeyFor(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

/**
 * Downloads a URL to a local cache file, reusing the cached copy if it's
 * fresh. These source files are large (tens of MB) and only change weekly
 * or annually, so re-downloading on every dev run is wasteful and slow.
 */
export async function downloadCached(url: string, label: string): Promise<Buffer> {
  await ensureCacheDir();
  const cachePath = path.join(CACHE_DIR, `${cacheKeyFor(url)}-${label}`);

  try {
    const stats = await stat(cachePath);
    if (Date.now() - stats.mtimeMs < CACHE_MAX_AGE_MS) {
      return await readFile(cachePath);
    }
  } catch {
    // not cached yet
  }

  console.log(`  downloading ${label} ...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "produce-pesticide-scanner-etl/0.1 (research/education use)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(cachePath, buf);
  return buf;
}
