import assert from "node:assert/strict";
import { test } from "node:test";
import { buildResidueData } from "./pdp.js";
import type { CropSourceMapping } from "../types.js";

const apple: CropSourceMapping = {
  cropId: "apple",
  cropName: "Apples",
  plu: ["4131"],
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
      { samplePk: "1", commod: "AP" },
      { samplePk: "2", commod: "AP" },
      { samplePk: "3", commod: "AP" },
      { samplePk: "4", commod: "AP" },
      { samplePk: "99", commod: "OG" }, // different crop — must not leak in
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

test("buildResidueData: computes percent detected and median only from actual detects", () => {
  const result = buildResidueData(apple, makeDataset());
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

test("buildResidueData: a 0 concentration counts as non-detect, not a detect", () => {
  const result = buildResidueData(apple, makeDataset());
  const pest001 = result!.findings.find((f) => f.chemical === "Pyrimethanil")!;
  // If the 0-concen row were miscounted as a detect this would be 75%, not 50%.
  assert.equal(pest001.percentSamplesDetected, 50);
});

test("buildResidueData: missing tolerance entry surfaces as null + explanatory note, not a crash", () => {
  const result = buildResidueData(apple, makeDataset());
  const pest002 = result!.findings.find((f) => f.chemical === "Some Unmapped Pesticide");
  assert.ok(pest002);
  assert.equal(pest002.legalTolerance, null);
  assert.equal(pest002.toleranceNote, "No EPA tolerance entry found for this pesticide/commodity pair");
  assert.equal(pest002.units, "ppb");
});

test("buildResidueData: results/samples from a different crop never leak into findings", () => {
  const result = buildResidueData(apple, makeDataset());
  assert.equal(
    result!.findings.some((f) => f.chemical.includes("003") || f.chemical === "003"),
    false,
  );
});

test("buildResidueData: findings are sorted by percentSamplesDetected descending", () => {
  const result = buildResidueData(apple, makeDataset());
  const percentages = result!.findings.map((f) => f.percentSamplesDetected);
  const sorted = [...percentages].sort((a, b) => b - a);
  assert.deepEqual(percentages, sorted);
});

test("buildResidueData: pesticides with zero detections across all samples are omitted entirely", () => {
  const dataset = makeDataset();
  dataset.results.push({ samplePk: "2", commod: "AP", pestCode: "004", concen: null, conUnit: "M" });
  dataset.pestNameByCode.set("004", "Never Detected Pesticide");
  const result = buildResidueData(apple, dataset);
  assert.equal(result!.findings.some((f) => f.chemical === "Never Detected Pesticide"), false);
});

test("buildResidueData: returns null when the crop has no samples in this year's PDP data", () => {
  const dataset = makeDataset();
  const uncoveredCrop: CropSourceMapping = { ...apple, pdpCommodityCodes: ["ZZ"] };
  const result = buildResidueData(uncoveredCrop, dataset);
  assert.equal(result, null);
});

test("buildResidueData: median of an even-length set averages the two middle values", () => {
  const dataset = makeDataset();
  // pest 001 currently has detects [0.02, 0.04] -> median 0.03, already covered above.
  // Add a third detect to make it odd-length and confirm the middle value is picked directly.
  dataset.results.push({ samplePk: "3", commod: "AP", pestCode: "001", concen: 0.09, conUnit: "M" });
  const result = buildResidueData(apple, dataset);
  const pest001 = result!.findings.find((f) => f.chemical === "Pyrimethanil")!;
  assert.equal(pest001.medianConcentration, 0.04); // sorted [0.02, 0.04, 0.09] -> middle is 0.04
});
