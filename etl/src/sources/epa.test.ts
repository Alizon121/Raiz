import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { buildRegisteredProducts, parseProdSiteLine } from "./epa.js";
import type { CropSourceMapping } from "../types.js";

test("parseProdSiteLine: decodes the verified real fixture line correctly", () => {
  // Hand-verified against sitename.zip during the original spike: this
  // exact line resolves to company=000003, product=00001, site=540002705
  // ("PET KENNELS (ENCLOSED PREMISE TREATMENT)").
  const result = parseProdSiteLine("00000300001540002705");
  assert.deepEqual(result, { regno: "3-1", site: "540002705" });
});

test("parseProdSiteLine: strips leading zeros from company/product numbers in the regno", () => {
  const result = parseProdSiteLine("10521100066040010106");
  // company=105211, product=00066 -> "105211-66", not "105211-00066"
  assert.equal(result!.regno, "105211-66");
});

test("parseProdSiteLine: returns null for a line shorter than the fixed-width layout (e.g. trailing blank line)", () => {
  assert.equal(parseProdSiteLine(""), null);
  assert.equal(parseProdSiteLine("00000300001"), null);
});

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
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockProductDetailFetch(byRegno: Record<string, unknown>) {
  globalThis.fetch = (async (url: string) => {
    const regno = url.split("/").pop()!;
    const items = byRegno[regno] ? [byRegno[regno]] : [];
    return { ok: true, json: async () => ({ items }) } as unknown as Response;
  }) as typeof fetch;
}

test("buildRegisteredProducts: dedups active ingredients case-insensitively, keeping the first-seen entry", async () => {
  mockProductDetailFetch({
    "3-1": {
      eparegno: "3-1",
      productname: "Product A",
      product_status: "Active",
      active_ingredients: [{ active_ing: "Glyphosate" }],
      pdffiles: [{ pdffile: "a.pdf", epa_reg_num: "3-1" }],
    },
    "3-2": {
      eparegno: "3-2",
      productname: "Product B",
      product_status: "Inactive",
      active_ingredients: [{ active_ing: "GLYPHOSATE" }, { active_ing: "Carbaryl" }],
      pdffiles: [{ pdffile: "b.pdf", epa_reg_num: "3-2" }],
    },
  });

  const productsBySite = new Map([["040010106", new Set(["3-1", "3-2"])]]);
  const result = await buildRegisteredProducts(apple, productsBySite);

  const names = result.activeIngredients.map((ai) => ai.name);
  assert.equal(names.filter((n) => n.toLowerCase() === "glyphosate").length, 1, "case-insensitive duplicate was not collapsed");
  assert.ok(names.includes("Carbaryl"));

  const glyphosate = result.activeIngredients.find((ai) => ai.name.toLowerCase() === "glyphosate")!;
  assert.equal(glyphosate.epaRegistrationStatus, "Active", "should keep the first-seen product's status, not overwrite it");
});

test("buildRegisteredProducts: labelLinks includes only the most recent PDF, not every historical label", async () => {
  mockProductDetailFetch({
    "3-1": {
      eparegno: "3-1",
      productname: "Product A",
      product_status: "Active",
      active_ingredients: [{ active_ing: "Mancozeb" }],
      pdffiles: [
        { pdffile: "newest.pdf", epa_reg_num: "3-1" },
        { pdffile: "older.pdf", epa_reg_num: "3-1" },
      ],
    },
  });

  const productsBySite = new Map([["040010106", new Set(["3-1"])]]);
  const result = await buildRegisteredProducts(apple, productsBySite);
  const mancozeb = result.activeIngredients.find((ai) => ai.name === "Mancozeb")!;
  assert.equal(mancozeb.labelLinks.length, 1);
  assert.match(mancozeb.labelLinks[0], /newest\.pdf$/);
});

test("buildRegisteredProducts: a product detail fetch returning no items is skipped without throwing", async () => {
  mockProductDetailFetch({}); // every regno resolves to an empty items array
  const productsBySite = new Map([["040010106", new Set(["3-1"])]]);
  const result = await buildRegisteredProducts(apple, productsBySite);
  assert.deepEqual(result.activeIngredients, []);
});
