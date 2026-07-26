import assert from "node:assert/strict";
import { test } from "node:test";
import { CROP_SEED } from "./crops.seed.js";

// These are cheap sanity checks against copy-paste mistakes when extending
// the seed list (e.g. reusing a PLU or EPA site code from the crop above),
// not a re-verification of the codes themselves — that requires checking
// the live source files, see README's "Extending the crop list" section.

test("crops.seed: every cropId is unique", () => {
  const ids = CROP_SEED.map((c) => c.cropId);
  assert.equal(new Set(ids).size, ids.length);
});

test("crops.seed: every crop has at least one PLU code", () => {
  for (const crop of CROP_SEED) {
    assert.ok(crop.plu.length > 0, `${crop.cropId} has no PLU codes`);
  }
});

test("crops.seed: every crop has exactly one EPA site code and one PDP commodity code", () => {
  for (const crop of CROP_SEED) {
    assert.equal(crop.epaSiteCodes.length, 1, `${crop.cropId} should have exactly one epaSiteCode`);
    assert.equal(crop.pdpCommodityCodes.length, 1, `${crop.cropId} should have exactly one pdpCommodityCode`);
  }
});

test("crops.seed: EPA site codes are 9 digits (matches the verified fixed-width layout)", () => {
  for (const crop of CROP_SEED) {
    for (const site of crop.epaSiteCodes) {
      assert.match(site, /^\d{9}$/, `${crop.cropId}'s site code "${site}" is not 9 digits`);
    }
  }
});

test("crops.seed: PDP commodity codes are exactly 2 letters (matches the PDP Commodity sheet format)", () => {
  for (const crop of CROP_SEED) {
    for (const code of crop.pdpCommodityCodes) {
      assert.match(code, /^[A-Z]{2}$/, `${crop.cropId}'s PDP code "${code}" is not 2 uppercase letters`);
    }
  }
});

test("crops.seed: no two crops share an EPA site code or a PDP commodity code", () => {
  const siteCodes = CROP_SEED.flatMap((c) => c.epaSiteCodes);
  const pdpCodes = CROP_SEED.flatMap((c) => c.pdpCommodityCodes);
  assert.equal(new Set(siteCodes).size, siteCodes.length, "a duplicate EPA site code exists across crops");
  assert.equal(new Set(pdpCodes).size, pdpCodes.length, "a duplicate PDP commodity code exists across crops");
});

test("crops.seed: no two crops share a PLU code", () => {
  const plus = CROP_SEED.flatMap((c) => c.plu);
  assert.equal(new Set(plus).size, plus.length, "a PLU code is assigned to more than one crop");
});
