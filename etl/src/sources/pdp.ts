import AdmZip from "adm-zip";
import ExcelJS from "exceljs";
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

interface SampleRow {
  samplePk: string;
  commod: string;
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
    rows.push({ samplePk: f[0], commod: f[6] });
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

async function parseReferenceTables(zip: AdmZip): Promise<{
  toleranceByKey: Map<string, ToleranceEntry>;
  pestNameByCode: Map<string, string>;
}> {
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".xlsx"));
  if (!entry) throw new Error("PDP reference tables xlsx not found in zip");

  const wb = new ExcelJS.Workbook();
  // exceljs's bundled types predate modern @types/node's Buffer<ArrayBufferLike> generic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(entry.getData() as any);

  const toleranceByKey = new Map<string, ToleranceEntry>();
  const toleranceSheet = wb.getWorksheet("Tolerance");
  toleranceSheet?.eachRow((row, rowNumber) => {
    if (rowNumber <= 4) return; // title rows + header
    const pestCode = String(row.getCell(1).value ?? "").trim();
    const commod = String(row.getCell(2).value ?? "").trim();
    const rawVal = String(row.getCell(3).value ?? "").trim();
    const unit = (String(row.getCell(4).value ?? "M").trim() as "M" | "B") || "M";
    const note = String(row.getCell(5).value ?? "").trim() || null;
    if (!pestCode || !commod) return;
    const numeric = Number(rawVal);
    toleranceByKey.set(`${pestCode}|${commod}`, {
      value: Number.isFinite(numeric) && rawVal !== "" ? numeric : null,
      unit,
      note: Number.isFinite(numeric) ? note : (rawVal || note), // surface NT/EX/SU as the note when non-numeric
    });
  });

  const pestNameByCode = new Map<string, string>();
  const pestSheet = wb.getWorksheet("Pest Code");
  pestSheet?.eachRow((row, rowNumber) => {
    if (rowNumber <= 4) return;
    const code = String(row.getCell(1).value ?? "").trim();
    const name = String(row.getCell(2).value ?? "").trim();
    if (code && name) pestNameByCode.set(code, name);
  });

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

/**
 * Pure, single-year build — kept separate from the multi-year fallback
 * orchestrator (below) so it stays simple to unit test with a hand-built
 * fixture dataset, no network involved.
 */
export function buildResidueDataForYear(crop: CropSourceMapping, dataset: PdpDataset, year: number): ResidueData | null {
  const commodSet = new Set(crop.pdpCommodityCodes);
  const samplePks = new Set(dataset.samples.filter((s) => commodSet.has(s.commod)).map((s) => s.samplePk));
  if (samplePks.size === 0) return null;

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

  return {
    sourceYear: year,
    sampleSize: samplePks.size,
    findings,
    dataAgeWarning: new Date().getFullYear() - year > PDP_DATA_AGE_WARNING_YEARS,
    cumulativeExposureNote:
      "Multiple pesticides are frequently detected on the same sample. PDP and EPA tolerances are set " +
      "per individual chemical; combined/cumulative exposure across multiple residues on one item is not " +
      "well characterized by this data and is not represented here.",
  };
}

/**
 * Walks backward from PDP_LATEST_YEAR, trying each year's dataset in turn,
 * until one actually tested this crop (has sample data for its commodity
 * codes) or PDP_MAX_FALLBACK_YEARS is exhausted. Returns null only if the
 * crop wasn't tested in any of those years — same "no data yet" meaning as
 * before, just checked across more years instead of one.
 *
 * `loadYear` defaults to the real network-backed loader; tests inject a
 * fixture-returning stub instead of mocking zip downloads.
 */
export async function buildResidueData(
  crop: CropSourceMapping,
  loadYear: (year: number) => Promise<PdpDataset> = loadPdpDatasetForYear,
): Promise<ResidueData | null> {
  for (let i = 0; i < PDP_MAX_FALLBACK_YEARS; i++) {
    const year = PDP_LATEST_YEAR - i;
    const dataset = await loadYear(year);
    const result = buildResidueDataForYear(crop, dataset, year);
    if (result) return result;
  }
  return null;
}
