import AdmZip from "adm-zip";
import ExcelJS from "exceljs";
import { downloadCached } from "../download.js";
import type { CropSourceMapping, ResidueData, ResidueFinding } from "../types.js";

// PDP publishes one annual zip per year at a fixed naming convention.
// Not every commodity is tested every year (PDP rotates commodities), so
// callers should be prepared for `null` residueData on crops not covered
// by PDP_YEAR. See README for how to add a multi-year fallback.
export const PDP_YEAR = 2024;
const PDP_YEAR_SHORT = String(PDP_YEAR).slice(2);
const PDP_ZIP_URL = `https://www.ams.usda.gov/sites/default/files/media/${PDP_YEAR}PDPDatabase.zip`;

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

interface PdpDataset {
  samples: SampleRow[];
  results: ResultRow[];
  toleranceByKey: Map<string, ToleranceEntry>; // key = `${pestCode}|${commod}`
  pestNameByCode: Map<string, string>;
}

const CONUNIT_TO_LABEL: Record<string, string> = { M: "ppm", B: "ppb", T: "ppt" };

async function loadZip(): Promise<AdmZip> {
  const buf = await downloadCached(PDP_ZIP_URL, `${PDP_YEAR}PDPDatabase.zip`);
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

let cachedDataset: Promise<PdpDataset> | null = null;

/** Downloads + parses the annual PDP zip once; shared across all crops. */
export async function loadPdpDataset(): Promise<PdpDataset> {
  if (!cachedDataset) {
    cachedDataset = (async () => {
      console.log(`USDA PDP: loading ${PDP_YEAR} annual database...`);
      const zip = await loadZip();
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
  }
  return cachedDataset;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function buildResidueData(crop: CropSourceMapping, dataset: PdpDataset): ResidueData | null {
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
    sourceYear: PDP_YEAR,
    sampleSize: samplePks.size,
    findings,
    cumulativeExposureNote:
      "Multiple pesticides are frequently detected on the same sample. PDP and EPA tolerances are set " +
      "per individual chemical; combined/cumulative exposure across multiple residues on one item is not " +
      "well characterized by this data and is not represented here.",
  };
}
