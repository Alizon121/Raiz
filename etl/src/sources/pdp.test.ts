import assert from "node:assert/strict";
import { test } from "node:test";
import { buildResidueData, buildResidueDataForYear, PDP_LATEST_YEAR, PDP_MAX_FALLBACK_YEARS } from "./pdp.js";
import type { CropSourceMapping } from "../types.js";
import type { PdpDataset } from "./pdp.js";

const apple: CropSourceMapping = {
  cropId: "apple",
  cropName: "Apples",
  plu: ["4131"],
  organicPlu: ["94131"],
  commonAliases: ["apple"],
  quickStatsCommodity: "APPLES",
  epaSiteCodes: ["040010106"],
  pdpCommodityCodes: ["AP"],
};

// Minimal fixture shaped like the real PDP dataset: 4 apple samples, one
// non-apple sample that must be excluded, and results mixing detects,
// non-detects, and a pesticide with no tolerance entry at all.
function makeDataset() {
  return {
    samples: [
      { samplePk: "1", commod: "AP", claim: "NC" },
      { samplePk: "2", commod: "AP", claim: "NC" },
      { samplePk: "3", commod: "AP", claim: "NC" },
      { samplePk: "4", commod: "AP", claim: "NC" },
      { samplePk: "99", commod: "OG", claim: "NC" }, // different crop — must not leak in
    ],
    results: [
      // pest "001" detected on 2 of 4 apple samples
      { samplePk: "1", commod: "AP", pestCode: "001", concen: 0.02, conUnit: "M" as const },
      { samplePk: "2", commod: "AP", pestCode: "001", concen: 0.04, conUnit: "M" as const },
      { samplePk: "3", commod: "AP", pestCode: "001", concen: null, conUnit: "M" as const }, // non-detect
      { samplePk: "4", commod: "AP", pestCode: "001", concen: 0, conUnit: "M" as const }, // non-detect (0)
      // pest "002" detected once, has no tolerance entry
      { samplePk: "1", commod: "AP", pestCode: "002", concen: 0.5, conUnit: "B" as const },
      // pest "003" only appears on the excluded orange sample
      { samplePk: "99", commod: "OG", pestCode: "003", concen: 1, conUnit: "M" as const },
    ],
    toleranceByKey: new Map([["001|AP", { value: 15, unit: "M" as const, note: null }]]),
    pestNameByCode: new Map([
      ["001", "Pyrimethanil"],
      ["002", "Some Unmapped Pesticide"],
    ]),
  };
}

test("buildResidueDataForYear: computes percent detected and median only from actual detects", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024);
  assert.ok(result);
  assert.equal(result.sampleSize, 4);

  const pest001 = result.findings.find((f) => f.chemical === "Pyrimethanil");
  assert.ok(pest001);
  // 2 detects out of 4 samples = 50%, not 2/2 (non-detects must count in the denominator)
  assert.equal(pest001.percentSamplesDetected, 50);
  assert.equal(pest001.medianConcentration, 0.03); // median of [0.02, 0.04]
  assert.equal(pest001.legalTolerance, 15);
  assert.equal(pest001.units, "ppm");
});

test("buildResidueDataForYear: a 0 concentration counts as non-detect, not a detect", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024);
  const pest001 = result!.findings.find((f) => f.chemical === "Pyrimethanil")!;
  // If the 0-concen row were miscounted as a detect this would be 75%, not 50%.
  assert.equal(pest001.percentSamplesDetected, 50);
});

test("buildResidueDataForYear: missing tolerance entry surfaces as null + explanatory note, not a crash", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024);
  const pest002 = result!.findings.find((f) => f.chemical === "Some Unmapped Pesticide");
  assert.ok(pest002);
  assert.equal(pest002.legalTolerance, null);
  assert.equal(pest002.toleranceNote, "No EPA tolerance entry found for this pesticide/commodity pair");
  assert.equal(pest002.units, "ppb");
});

test("buildResidueDataForYear: results/samples from a different crop never leak into findings", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024);
  assert.equal(
    result!.findings.some((f) => f.chemical.includes("003") || f.chemical === "003"),
    false,
  );
});

test("buildResidueDataForYear: findings are sorted by percentSamplesDetected descending", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024);
  const percentages = result!.findings.map((f) => f.percentSamplesDetected);
  const sorted = [...percentages].sort((a, b) => b - a);
  assert.deepEqual(percentages, sorted);
});

test("buildResidueDataForYear: pesticides with zero detections across all samples are omitted entirely", () => {
  const dataset = makeDataset();
  dataset.results.push({ samplePk: "2", commod: "AP", pestCode: "004", concen: null, conUnit: "M" });
  dataset.pestNameByCode.set("004", "Never Detected Pesticide");
  const result = buildResidueDataForYear(apple, dataset, 2024);
  assert.equal(result!.findings.some((f) => f.chemical === "Never Detected Pesticide"), false);
});

test("buildResidueDataForYear: returns null when the crop has no samples in this year's PDP data", () => {
  const dataset = makeDataset();
  const uncoveredCrop: CropSourceMapping = { ...apple, pdpCommodityCodes: ["ZZ"] };
  const result = buildResidueDataForYear(uncoveredCrop, dataset, 2024);
  assert.equal(result, null);
});

test("buildResidueDataForYear: median of an even-length set averages the two middle values", () => {
  const dataset = makeDataset();
  // pest 001 currently has detects [0.02, 0.04] -> median 0.03, already covered above.
  // Add a third detect to make it odd-length and confirm the middle value is picked directly.
  dataset.results.push({ samplePk: "3", commod: "AP", pestCode: "001", concen: 0.09, conUnit: "M" });
  const result = buildResidueDataForYear(apple, dataset, 2024);
  const pest001 = result!.findings.find((f) => f.chemical === "Pyrimethanil")!;
  assert.equal(pest001.medianConcentration, 0.04); // sorted [0.02, 0.04, 0.09] -> middle is 0.04
});

test("buildResidueDataForYear: dataAgeWarning is false for data within the 3-year threshold, true beyond it", () => {
  const recentYear = new Date().getFullYear() - 2;
  const staleYear = new Date().getFullYear() - 4;
  assert.equal(buildResidueDataForYear(apple, makeDataset(), recentYear)!.dataAgeWarning, false);
  assert.equal(buildResidueDataForYear(apple, makeDataset(), staleYear)!.dataAgeWarning, true);
});

test("buildResidueDataForYear: sourceYear reflects whichever year was actually passed in", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2019);
  assert.equal(result!.sourceYear, 2019);
});

// --- organic vs. conventional separation ---

function makeMixedClaimDataset() {
  const d = makeDataset();
  // Two organic apple samples: pest 001 detected on one of them, and a pest
  // (005) that only ever shows up on organic.
  d.samples.push({ samplePk: "10", commod: "AP", claim: "PO" }, { samplePk: "11", commod: "AP", claim: "PO" });
  d.results.push(
    { samplePk: "10", commod: "AP", pestCode: "001", concen: 0.01, conUnit: "M" as const },
    { samplePk: "11", commod: "AP", pestCode: "001", concen: null, conUnit: "M" as const },
    { samplePk: "10", commod: "AP", pestCode: "005", concen: 0.2, conUnit: "B" as const },
  );
  d.pestNameByCode.set("005", "Organic Only Pesticide");
  return d;
}

test("buildResidueDataForYear: organic (PO) samples are excluded from the conventional stats", () => {
  const result = buildResidueDataForYear(apple, makeMixedClaimDataset(), 2024)!;
  assert.equal(result.sampleSize, 4); // not 6
  const pest001 = result.findings.find((f) => f.chemical === "Pyrimethanil")!;
  assert.equal(pest001.percentSamplesDetected, 50); // organic samples don't dilute the denominator
  assert.equal(pest001.medianConcentration, 0.03); // organic 0.01 doesn't pull the median down
  assert.equal(result.findings.some((f) => f.chemical === "Organic Only Pesticide"), false);
});

test("buildResidueDataForYear: organic block has its own sample size and findings", () => {
  const result = buildResidueDataForYear(apple, makeMixedClaimDataset(), 2024)!;
  assert.ok(result.organic);
  assert.equal(result.organic.sampleSize, 2);
  const pest001 = result.organic.findings.find((f) => f.chemical === "Pyrimethanil")!;
  assert.equal(pest001.percentSamplesDetected, 50); // 1 of 2 organic samples
  assert.equal(pest001.medianConcentration, 0.01);
  assert.ok(result.organic.findings.some((f) => f.chemical === "Organic Only Pesticide"));
});

test("buildResidueDataForYear: organic is null when the year has no organic samples", () => {
  const result = buildResidueDataForYear(apple, makeDataset(), 2024)!;
  assert.equal(result.organic, null);
});

test("buildResidueDataForYear: PD and PP claims stay in the conventional pool, not organic", () => {
  const d = makeDataset();
  d.samples.push({ samplePk: "20", commod: "AP", claim: "PD" }, { samplePk: "21", commod: "AP", claim: "PP" });
  const result = buildResidueDataForYear(apple, d, 2024)!;
  assert.equal(result.sampleSize, 6);
  assert.equal(result.organic, null);
});

test("buildResidueDataForYear: a missing claim is treated as conventional", () => {
  const d = makeDataset();
  d.samples.push({ samplePk: "30", commod: "AP", claim: "" });
  assert.equal(buildResidueDataForYear(apple, d, 2024)!.sampleSize, 5);
});

test("buildResidueDataForYear: an organic-only year leaves the conventional side empty and still returns the organic block", () => {
  const d = makeMixedClaimDataset();
  d.samples = d.samples.filter((s) => s.commod !== "AP" || s.claim === "PO");
  const result = buildResidueDataForYear(apple, d, 2024)!;
  assert.equal(result.sampleSize, 0);
  assert.deepEqual(result.findings, []);
  assert.equal(result.organic!.sampleSize, 2);
});

const emptyDataset: PdpDataset = { samples: [], results: [], toleranceByKey: new Map(), pestNameByCode: new Map() };

function onlyPool(d: ReturnType<typeof makeMixedClaimDataset>, keep: "PO" | "conv") {
  d.samples = d.samples.filter((s) => s.commod !== "AP" || (keep === "PO" ? s.claim === "PO" : s.claim !== "PO"));
  return d;
}

test("buildResidueData: an organic-only newest year leaves the conventional side to fall back on its own year", async () => {
  const result = await buildResidueData(apple, async (year) =>
    year === PDP_LATEST_YEAR ? onlyPool(makeMixedClaimDataset(), "PO") : onlyPool(makeMixedClaimDataset(), "conv"),
  );
  assert.equal(result!.organic!.sourceYear, PDP_LATEST_YEAR);
  assert.equal(result!.sourceYear, PDP_LATEST_YEAR - 1); // conventional came from the next year back
  assert.equal(result!.sampleSize, 4);
});

test("buildResidueData: organic falls back to an older year when the newest year has none", async () => {
  const organicYear = PDP_LATEST_YEAR - 2;
  const result = await buildResidueData(apple, async (year) =>
    year === organicYear ? makeMixedClaimDataset() : makeDataset(), // makeDataset has conventional only
  );
  assert.equal(result!.sourceYear, PDP_LATEST_YEAR); // conventional from the newest year
  assert.equal(result!.organic!.sourceYear, organicYear);
  assert.equal(result!.organic!.sampleSize, 2);
});

test("buildResidueData: conventional data is never used as the organic block when no year has organic samples", async () => {
  const result = await buildResidueData(apple, async () => makeDataset());
  assert.equal(result!.organic, null);
  assert.equal(result!.sampleSize, 4);
});

test("buildResidueData: a crop with only organic samples in the window gets an empty conventional side", async () => {
  const result = await buildResidueData(apple, async () => onlyPool(makeMixedClaimDataset(), "PO"));
  assert.equal(result!.sampleSize, 0);
  assert.deepEqual(result!.findings, []);
  assert.equal(result!.organic!.sampleSize, 2);
});

test("buildResidueData: uses PDP_LATEST_YEAR directly when that year has the crop's data", async () => {
  const attemptedYears: number[] = [];
  const result = await buildResidueData(apple, async (year) => {
    attemptedYears.push(year);
    return makeDataset(); // has apple ("AP") data at every year queried
  });
  // makeDataset has no organic samples, so the organic walk continues through the whole window.
  assert.equal(attemptedYears.length, PDP_MAX_FALLBACK_YEARS);
  assert.equal(result!.sourceYear, PDP_LATEST_YEAR);
});

test("buildResidueData: stops after the newest year when it has both conventional and organic samples", async () => {
  const attemptedYears: number[] = [];
  await buildResidueData(apple, async (year) => {
    attemptedYears.push(year);
    return makeMixedClaimDataset();
  });
  assert.deepEqual(attemptedYears, [PDP_LATEST_YEAR]);
});

test("buildResidueData: falls back to older years in order until one has the crop's data", async () => {
  const attemptedYears: number[] = [];
  const yearWithData = PDP_LATEST_YEAR - 2;
  const result = await buildResidueData(apple, async (year) => {
    attemptedYears.push(year);
    return year === yearWithData ? makeDataset() : emptyDataset;
  });
  // organic can't resolve either (fixture has none), so every year in the window is tried.
  assert.equal(attemptedYears.length, PDP_MAX_FALLBACK_YEARS);
  assert.equal(result!.sourceYear, yearWithData);
});

test("buildResidueData: gives up and returns null after PDP_MAX_FALLBACK_YEARS with no data", async () => {
  const attemptedYears: number[] = [];
  const result = await buildResidueData(apple, async (year) => {
    attemptedYears.push(year);
    return emptyDataset;
  });
  assert.equal(result, null);
  assert.equal(attemptedYears.length, PDP_MAX_FALLBACK_YEARS);
});
