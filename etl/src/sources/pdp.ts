import AdmZip from "adm-zip";
import * as XLSX from "xlsx";
import { downloadCached } from "../download.js";
import type { CropSourceMapping, ResidueData, ResidueFinding } from "../types.js";

// PDP publishes one annual zip per year at a fixed naming convention.
// Not every commodity is tested every year (PDP rotates commodities) — 2024
// alone tested only 19 of them — so a single-year lookup misses most crops
// entirely. buildResidueData walks backward from PDP_LATEST_YEAR until it
// finds a year that actually tested the crop, capped at PDP_MAX_FALLBACK_YEARS
// so one never-tested crop can't trigger an unbounded string of downloads.
// URL pattern verified live back through 2019.
export const PDP_LATEST_YEAR = 2024;
export const PDP_MAX_FALLBACK_YEARS = 5;
// Matches quickstats.ts's own DATA_AGE_WARNING_YEARS threshold — kept as a
// separate constant since the two sources are independent modules, but the
// policy (3 years) is deliberately the same across both.
const PDP_DATA_AGE_WARNING_YEARS = 3;

function pdpZipUrl(year: number): string {
  return `https://www.ams.usda.gov/sites/default/files/media/${year}PDPDatabase.zip`;
}

// Commodity Marketing Claim (Samples column 14): NC = no claim, PD = no
// pesticides detected, PO = organic, PP = pesticide free. Only PO is
// certified organic; PD/PP are self-declared labels, so they are kept in the
// conventional pool (see isOrganicClaim) rather than being treated as organic.
export const PDP_ORGANIC_CLAIM = "PO";

interface SampleRow {
  samplePk: string;
  commod: string;
  claim: string; // "" when the column is absent
}

interface ResultRow {
  samplePk: string;
  commod: string;
  pestCode: string;
  concen: number | null; // null/0 = non-detect
  conUnit: "M" | "B" | "T";
}

interface ToleranceEntry {
  value: number | null; // null = NT/EX/SU (no numeric tolerance)
  unit: "M" | "B";
  note: string | null;
}

export interface PdpDataset {
  samples: SampleRow[];
  results: ResultRow[];
  toleranceByKey: Map<string, ToleranceEntry>; // key = `${pestCode}|${commod}`
  pestNameByCode: Map<string, string>;
}

const CONUNIT_TO_LABEL: Record<string, string> = { M: "ppm", B: "ppb", T: "ppt" };

async function loadZip(year: number): Promise<AdmZip> {
  const buf = await downloadCached(pdpZipUrl(year), `${year}PDPDatabase.zip`);
  return new AdmZip(buf);
}

function parseSamples(text: string): SampleRow[] {
  const rows: SampleRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const f = line.split("|");
    rows.push({ samplePk: f[0], commod: f[6], claim: (f[13] ?? "").trim() });
  }
  return rows;
}

function parseResults(text: string): ResultRow[] {
  const rows: ResultRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const f = line.split("|");
    const concenRaw = f[6];
    rows.push({
      samplePk: f[0],
      commod: f[1],
      pestCode: f[4],
      concen: concenRaw ? Number(concenRaw) : null,
      conUnit: (f[8] as "M" | "B" | "T") || "M",
    });
  }
  return rows;
}

/**
 * Reads a worksheet as an array of rows (each row an array of cell values),
 * skipping the same 4 title/header rows every PDP reference-table sheet
 * ships with — data starts at (1-indexed) row 5. Row/col are 0-indexed
 * arrays here, so `cell(row, 1)` below means "1-indexed column 1".
 */
function sheetRows(wb: XLSX.WorkBook, name: string): unknown[][] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, range: 4, defval: "" });
}

function cell(row: unknown[], col1Indexed: number): string {
  return String(row[col1Indexed - 1] ?? "").trim();
}

async function parseReferenceTables(zip: AdmZip): Promise<{
  toleranceByKey: Map<string, ToleranceEntry>;
  pestNameByCode: Map<string, string>;
}> {
  // Only 2024 onward ships `.xlsx` — every earlier year (back through at
  // least 2019, which is as far as PDP_MAX_FALLBACK_YEARS reaches) ships
  // the legacy binary `.xls` instead. `xlsx` (SheetJS) reads both through
  // one API; a `.xlsx`-only matcher here would throw as soon as
  // buildResidueData's year-fallback reached a pre-2024 year.
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".xlsx") || e.entryName.endsWith(".xls"));
  if (!entry) throw new Error("PDP reference tables .xlsx/.xls not found in zip");

  const wb = XLSX.read(entry.getData(), { type: "buffer" });

  const toleranceByKey = new Map<string, ToleranceEntry>();
  for (const row of sheetRows(wb, "Tolerance")) {
    const pestCode = cell(row, 1);
    const commod = cell(row, 2);
    const rawVal = cell(row, 3);
    const unit = (cell(row, 4) as "M" | "B") || "M";
    const note = cell(row, 5) || null;
    if (!pestCode || !commod) continue;
    const numeric = Number(rawVal);
    toleranceByKey.set(`${pestCode}|${commod}`, {
      value: Number.isFinite(numeric) && rawVal !== "" ? numeric : null,
      unit,
      note: Number.isFinite(numeric) ? note : (rawVal || note), // surface NT/EX/SU as the note when non-numeric
    });
  }

  const pestNameByCode = new Map<string, string>();
  for (const row of sheetRows(wb, "Pest Code")) {
    const code = cell(row, 1);
    const name = cell(row, 2);
    if (code && name) pestNameByCode.set(code, name);
  }

  return { toleranceByKey, pestNameByCode };
}

const datasetCacheByYear = new Map<number, Promise<PdpDataset>>();

/**
 * Downloads + parses one year's annual PDP zip, once per year — shared
 * across all crops that end up trying that year (either as PDP_LATEST_YEAR
 * or as a fallback), so e.g. two crops both falling back to 2022 only
 * download that zip a single time.
 */
export async function loadPdpDatasetForYear(year: number): Promise<PdpDataset> {
  let cached = datasetCacheByYear.get(year);
  if (!cached) {
    cached = (async () => {
      console.log(`USDA PDP: loading ${year} annual database...`);
      const zip = await loadZip(year);
      const samplesEntry = zip.getEntries().find((e) => /Samples\.txt$/i.test(e.entryName));
      const resultsEntry = zip.getEntries().find((e) => /Results\.txt$/i.test(e.entryName));
      if (!samplesEntry || !resultsEntry) {
        throw new Error("PDP samples/results text files not found in zip");
      }
      const samples = parseSamples(samplesEntry.getData().toString("latin1"));
      const results = parseResults(resultsEntry.getData().toString("latin1"));
      const { toleranceByKey, pestNameByCode } = await parseReferenceTables(zip);
      return { samples, results, toleranceByKey, pestNameByCode };
    })();
    datasetCacheByYear.set(year, cached);
  }
  return cached;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const CUMULATIVE_EXPOSURE_NOTE =
  "Multiple pesticides are frequently detected on the same sample. PDP and EPA tolerances are set " +
  "per individual chemical; combined/cumulative exposure across multiple residues on one item is not " +
  "well characterized by this data and is not represented here.";

function isOrganicClaim(claim: string): boolean {
  return claim === PDP_ORGANIC_CLAIM;
}

/** Findings + sample size for one pool of samples (conventional or organic). */
function buildFindings(
  crop: CropSourceMapping,
  dataset: PdpDataset,
  samplePks: Set<string>,
  commodSet: Set<string>,
): ResidueFinding[] {
  const resultsForCrop = dataset.results.filter((r) => samplePks.has(r.samplePk) && commodSet.has(r.commod));

  const byPest = new Map<string, ResultRow[]>();
  for (const r of resultsForCrop) {
    if (!byPest.has(r.pestCode)) byPest.set(r.pestCode, []);
    byPest.get(r.pestCode)!.push(r);
  }

  const findings: ResidueFinding[] = [];
  for (const [pestCode, rows] of byPest) {
    const detected = rows.filter((r) => r.concen !== null && r.concen > 0);
    if (detected.length === 0) continue; // only report pesticides actually found, per spec's "residue findings"

    const commod = crop.pdpCommodityCodes[0];
    const tol = dataset.toleranceByKey.get(`${pestCode}|${commod}`);
    const chemical = dataset.pestNameByCode.get(pestCode) ?? `Pesticide code ${pestCode}`;

    findings.push({
      chemical,
      percentSamplesDetected: Number(((detected.length / samplePks.size) * 100).toFixed(1)),
      medianConcentration: Number(median(detected.map((r) => r.concen!)).toFixed(4)),
      legalTolerance: tol?.value ?? null,
      toleranceNote: tol ? tol.note : "No EPA tolerance entry found for this pesticide/commodity pair",
      units: CONUNIT_TO_LABEL[rows[0].conUnit] ?? rows[0].conUnit,
    });
  }

  findings.sort((a, b) => b.percentSamplesDetected - a.percentSamplesDetected);
  return findings;
}

type SamplePool = "conventional" | "organic";

interface PoolResult {
  sourceYear: number;
  sampleSize: number;
  findings: ResidueFinding[];
  dataAgeWarning: boolean;
}

/**
 * One year's stats for one pool of samples: "organic" is claim PO only,
 * "conventional" is every other claim. Returns null when that pool has no
 * samples for the crop that year, which is what lets each pool fall back to
 * an older year independently.
 */
function buildPoolForYear(crop: CropSourceMapping, dataset: PdpDataset, year: number, pool: SamplePool): PoolResult | null {
  const commodSet = new Set(crop.pdpCommodityCodes);
  const wantOrganic = pool === "organic";
  const samplePks = new Set(
    dataset.samples.filter((s) => commodSet.has(s.commod) && isOrganicClaim(s.claim) === wantOrganic).map((s) => s.samplePk),
  );
  if (samplePks.size === 0) return null;
  return {
    sourceYear: year,
    sampleSize: samplePks.size,
    findings: buildFindings(crop, dataset, samplePks, commodSet),
    dataAgeWarning: new Date().getFullYear() - year > PDP_DATA_AGE_WARNING_YEARS,
  };
}

function assembleResidueData(conventional: PoolResult | null, organic: PoolResult | null): ResidueData | null {
  const base = conventional ?? organic;
  if (!base) return null;
  return {
    sourceYear: base.sourceYear,
    // No conventional samples in the window: leave this side empty rather than
    // presenting organic (or another pool's) numbers as conventional.
    sampleSize: conventional?.sampleSize ?? 0,
    findings: conventional?.findings ?? [],
    dataAgeWarning: base.dataAgeWarning,
    cumulativeExposureNote: CUMULATIVE_EXPOSURE_NOTE,
    organic: organic,
  };
}

/**
 * Pure, single-year build — kept separate from the multi-year fallback
 * orchestrator (below) so it stays simple to unit test with a hand-built
 * fixture dataset, no network involved. Both pools come from this one year;
 * buildResidueData is what lets them resolve to different years.
 */
export function buildResidueDataForYear(crop: CropSourceMapping, dataset: PdpDataset, year: number): ResidueData | null {
  return assembleResidueData(
    buildPoolForYear(crop, dataset, year, "conventional"),
    buildPoolForYear(crop, dataset, year, "organic"),
  );
}

/**
 * Walks backward from PDP_LATEST_YEAR, once per pool. The conventional stats
 * come from the newest year with conventional samples for this crop, and the
 * organic block from the newest year with organic (PO) samples — these can
 * be different years, and each side carries its own sourceYear so the app can
 * say so. Neither pool ever borrows the other's data. Returns null only if
 * neither was found within PDP_MAX_FALLBACK_YEARS.
 *
 * Years are loaded lazily and only until both pools are resolved; the
 * default loader caches per year, so the second pool's walk costs no extra
 * downloads. `loadYear` is injectable so tests don't mock zip downloads.
 */
export async function buildResidueData(
  crop: CropSourceMapping,
  loadYear: (year: number) => Promise<PdpDataset> = loadPdpDatasetForYear,
): Promise<ResidueData | null> {
  let conventional: PoolResult | null = null;
  let organic: PoolResult | null = null;
  for (let i = 0; i < PDP_MAX_FALLBACK_YEARS && (!conventional || !organic); i++) {
    const year = PDP_LATEST_YEAR - i;
    const dataset = await loadYear(year);
    conventional ??= buildPoolForYear(crop, dataset, year, "conventional");
    organic ??= buildPoolForYear(crop, dataset, year, "organic");
  }
  return assembleResidueData(conventional, organic);
}
