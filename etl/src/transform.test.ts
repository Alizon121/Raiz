import assert from "node:assert/strict";
import { test } from "node:test";
import { CROP_SEED } from "./crops.seed.js";
import { getResidueReductionTips } from "./transform.js";

test("every seeded crop has at least one residue-reduction tip", () => {
  for (const crop of CROP_SEED) {
    assert.ok(getResidueReductionTips(crop.cropId).length > 0, `${crop.cropId} has no residue-reduction tips`);
  }
});

test("an unrecognized crop ID falls back to the default tip set instead of throwing", () => {
  assert.ok(getResidueReductionTips("not-a-real-crop").length > 0);
});

// Regression test for the bug where every crop got the exact same generic
// tips regardless of how that produce is actually handled/eaten (e.g. apple
// and avocado — very different handling — showing identical advice).
test("no two seeded crops share the exact same residue-reduction tip set", () => {
  const serialized = CROP_SEED.map((crop) => JSON.stringify(getResidueReductionTips(crop.cropId)));
  assert.equal(new Set(serialized).size, serialized.length, "two or more crops have identical tip lists");
});
