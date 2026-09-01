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

test("crops.seed: every crop has exactly one EPA site code, and at most one PDP commodity code", () => {
  for (const crop of CROP_SEED) {
    assert.equal(crop.epaSiteCodes.length, 1, `${crop.cropId} should have exactly one epaSiteCode`);
    // 0 is legitimate (not a mistake) for a crop PDP hasn't tested within
    // PDP_MAX_FALLBACK_YEARS' reach — e.g. strawberry, see crops.seed.ts.
    assert.ok(
      crop.pdpCommodityCodes.length <= 1,
      `${crop.cropId} should have at most one pdpCommodityCode`,
    );
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

// tomato/tomato-cherry are the one legitimate exception: verified live
// against sitename.zip that EPA's site vocabulary has no separate
// registration site for cherry tomatoes at all — every tomato variety
// registers under the single generic TOMATOES (FOLIAR TREATMENT) site
// (110050106), so both crops correctly share it. PDP does distinguish them
// (commodity codes TO vs. CT), which is why residueData still differs
// between the two even though registeredProducts will be identical.
const KNOWN_SHARED_SITE_CODES = new Set(["110050106"]);

test("crops.seed: no two crops share an EPA site code or a PDP commodity code, aside from documented exceptions", () => {
  const siteCodes = CROP_SEED.flatMap((c) => c.epaSiteCodes).filter((code) => !KNOWN_SHARED_SITE_CODES.has(code));
  const pdpCodes = CROP_SEED.flatMap((c) => c.pdpCommodityCodes);
  assert.equal(new Set(siteCodes).size, siteCodes.length, "a duplicate EPA site code exists across crops");
  assert.equal(new Set(pdpCodes).size, pdpCodes.length, "a duplicate PDP commodity code exists across crops");
});

test("crops.seed: no two crops share a PLU code", () => {
  const plus = CROP_SEED.flatMap((c) => c.plu);
  assert.equal(new Set(plus).size, plus.length, "a PLU code is assigned to more than one crop");
});
