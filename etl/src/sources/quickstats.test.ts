import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { buildChemicalUse } from "./quickstats.js";
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

const originalFetch = globalThis.fetch;

function mockFetchJson(body: unknown, ok = true, status = 200) {
  globalThis.fetch = (async () =>
    ({
      ok,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }) as unknown as Response) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("buildChemicalUse: returns null without hitting the network when no API key is set", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error("should not be called");
  }) as typeof fetch;

  const result = await buildChemicalUse(apple, undefined);
  assert.equal(result, null);
  assert.equal(called, false);
});

test("buildChemicalUse: returns null on non-OK HTTP response", async () => {
  mockFetchJson({ error: ["unauthorized"] }, false, 401);
  const result = await buildChemicalUse(apple, "bad-key");
  assert.equal(result, null);
});

test("buildChemicalUse: returns null when the API returns no rows", async () => {
  mockFetchJson({ data: [] });
  const result = await buildChemicalUse(apple, "key");
  assert.equal(result, null);
});

test("buildChemicalUse: returns null when no rows match the PCT OF AREA ..., AVG unit filter", async () => {
  mockFetchJson({
    data: [{ year: "2025", state_alpha: "", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (CARBARYL = 1)", unit_desc: "PCT OF AREA BEARING, MEDIAN", Value: "50" }],
  });
  const result = await buildChemicalUse(apple, "key");
  assert.equal(result, null);
});

// One combined fixture exercising every real-world quirk found by hand
// against the live API: a category rollup, a non-pesticide domain, a
// restricted-use duplicate, two IDs sharing a display name, a withheld
// value, a stale year, and a non-AVG variant that must all be filtered out
// or resolved correctly, leaving only the clean set behind.
function fullFixture() {
  return {
    data: [
      // the real signal: national-level insecticide row for 2025
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (CARBARYL = 1234)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "51" },
      // state breakdown of the same chemical — must not be used as the value, but its state counts toward sourceStates
      { year: "2025", state_alpha: "WA", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (CARBARYL = 1234)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "48" },
      // (TOTAL) rollup — must be excluded entirely
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (TOTAL)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "77" },
      // fertilizer — non-pesticide domain, must be excluded
      { year: "2025", state_alpha: "", domain_desc: "FERTILIZER", domaincat_desc: "FERTILIZER: (NITROGEN)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "99" },
      // restricted-use duplicate of an already-counted chemical — must be excluded (not double-counted)
      { year: "2025", state_alpha: "", domain_desc: "RESTRICTED USE CHEMICAL, INSECTICIDE", domaincat_desc: "RESTRICTED USE CHEMICAL, INSECTICIDE: (CARBARYL = 1234)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "51" },
      // two distinct chemical IDs sharing the display name PERMETHRIN — higher value should win, not the last-seen one
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (PERMETHRIN = 111)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "40" },
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, INSECTICIDE", domaincat_desc: "CHEMICAL, INSECTICIDE: (PERMETHRIN = 222)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "90" },
      // withheld-for-disclosure value — must be dropped, not coerced to 0
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, FUNGICIDE", domaincat_desc: "CHEMICAL, FUNGICIDE: (WITHHELDFUNGICIDE = 5)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "(D)" },
      // stale prior-year row — must not affect the current (2025) result
      { year: "2023", state_alpha: "", domain_desc: "CHEMICAL, HERBICIDE", domaincat_desc: "CHEMICAL, HERBICIDE: (OLDHERBICIDE = 9)", unit_desc: "PCT OF AREA BEARING, AVG", Value: "95" },
      // non-AVG variant of a real chemical — must not be treated as the AVG value
      { year: "2025", state_alpha: "", domain_desc: "CHEMICAL, HERBICIDE", domaincat_desc: "CHEMICAL, HERBICIDE: (GLYPHOSATE = 3)", unit_desc: "PCT OF AREA BEARING, MEDIAN", Value: "33" },
    ],
  };
}

test("buildChemicalUse: filters TOTAL rollups, non-pesticide domains, restricted-use dupes, stale years, and non-AVG rows; keeps the higher of two same-name IDs", async () => {
  mockFetchJson(fullFixture());
  const result = await buildChemicalUse(apple, "key");
  assert.ok(result);

  assert.equal(result.sourceYear, 2025);

  const names = result.topActiveIngredients.map((ai) => ai.name);
  assert.equal(names.includes("TOTAL"), false, "(TOTAL) rollup leaked through");
  assert.equal(names.includes("NITROGEN"), false, "fertilizer leaked through");
  assert.equal(names.includes("WITHHELDFUNGICIDE"), false, "(D)-withheld value was coerced instead of dropped");
  assert.equal(names.includes("OLDHERBICIDE"), false, "stale prior-year row leaked into the current result");
  assert.equal(names.includes("GLYPHOSATE"), false, "a non-AVG unit_desc row was treated as the AVG value");

  const carbaryl = result.topActiveIngredients.filter((ai) => ai.name === "CARBARYL");
  assert.equal(carbaryl.length, 1, "restricted-use duplicate was not collapsed into the plain-domain row");
  assert.equal(carbaryl[0].percentAcresTreated, 51);
  assert.equal(carbaryl[0].category, "insecticide");

  const permethrin = result.topActiveIngredients.find((ai) => ai.name === "PERMETHRIN");
  assert.ok(permethrin);
  assert.equal(permethrin.percentAcresTreated, 90, "should keep the higher of the two same-name chemical IDs");
});

test("buildChemicalUse: sourceStates collects state-level breakdown rows even though only the national row sets the value", async () => {
  mockFetchJson(fullFixture());
  const result = await buildChemicalUse(apple, "key");
  assert.deepEqual(result!.sourceStates, ["WA"]);
});

test("buildChemicalUse: dataAgeWarning is true when the latest year is more than 3 years old", async () => {
  mockFetchJson({
    data: [
      {
        year: String(new Date().getFullYear() - 5),
        state_alpha: "",
        domain_desc: "CHEMICAL, INSECTICIDE",
        domaincat_desc: "CHEMICAL, INSECTICIDE: (OLDCHEM = 1)",
        unit_desc: "PCT OF AREA PLANTED, AVG",
        Value: "10",
      },
    ],
  });
  const result = await buildChemicalUse(apple, "key");
  assert.equal(result!.dataAgeWarning, true);
});
