import AdmZip from "adm-zip";
import { downloadCached } from "../download.js";
import type { CropSourceMapping, RegisteredActiveIngredient, RegisteredProducts } from "../types.js";

const PPIS_BASE = "https://www3.epa.gov/pesticides/PPISdata";

// Fixed-width layout verified against live files (no shipped delimiter/schema doc):
// prodsite.txt row = company(6) + product(5) + site_code(9), no separators.
const COMPANY_LEN = 6;
const PRODUCT_LEN = 5;
const SITE_LEN = 9;

interface ProductRecord {
  eparegno: string;
  status: string; // rightmost field per product.txt; see parseProductFile
}

async function fetchZipText(filename: string): Promise<string> {
  const buf = await downloadCached(`${PPIS_BASE}/${filename}`, filename);
  const zip = new AdmZip(buf);
  const entry = zip.getEntries().find((e) => e.entryName.toLowerCase().endsWith(".txt"));
  if (!entry) throw new Error(`No .txt entry found in ${filename}`);
  return entry.getData().toString("latin1");
}

/** site_code -> product regnos registered for that site */
async function loadProductsBySite(): Promise<Map<string, Set<string>>> {
  const text = await fetchZipText("prodsite.zip");
  const bySite = new Map<string, Set<string>>();
  for (const line of text.split("\n")) {
    if (line.length < COMPANY_LEN + PRODUCT_LEN + SITE_LEN) continue;
    const company = line.slice(0, COMPANY_LEN);
    const product = line.slice(COMPANY_LEN, COMPANY_LEN + PRODUCT_LEN);
    const site = line.slice(COMPANY_LEN + PRODUCT_LEN, COMPANY_LEN + PRODUCT_LEN + SITE_LEN);
    const regno = `${Number(company)}-${Number(product)}`;
    let set = bySite.get(site);
    if (!set) {
      set = new Set();
      bySite.set(site, set);
    }
    set.add(regno);
  }
  return bySite;
}

// product.txt layout: verified only loosely (undocumented like prodsite.txt).
// We deliberately avoid guessing its column widths here and instead confirm
// "is this product currently registered" via the live per-product detail
// endpoint (cswu/ppls/{regno}), which is a stable, JSON, self-describing
// response we've verified directly. This trades a bulk-file parse for a
// bounded number of HTTP calls per crop, capped below.
const MAX_PRODUCTS_PER_CROP = 15;
const PRODUCT_DETAIL_DELAY_MS = 300;

interface ProductDetail {
  eparegno: string;
  productname: string;
  product_status: string;
  active_ingredients?: { active_ing: string; cas_number?: string }[];
  pdffiles?: { pdffile: string; epa_reg_num: string }[];
}

const MAX_ATTEMPTS = 3;

async function fetchProductDetail(regno: string): Promise<ProductDetail | null> {
  const url = `https://ordspub.epa.gov/ords/pesticides/cswu/ppls/${regno}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "produce-pesticide-scanner-etl/0.1" } });
      if (!res.ok) return null; // a real 404/etc — not worth retrying
      const body = (await res.json()) as { items?: ProductDetail[] };
      return body.items?.[0] ?? null;
    } catch (err) {
      // Transient network errors (timeouts, resets) — retry with backoff
      // rather than letting one flaky request abort the whole ETL run.
      if (attempt === MAX_ATTEMPTS) {
        console.warn(`  [epa] giving up on ${regno} after ${MAX_ATTEMPTS} attempts: ${(err as Error).message}`);
        return null;
      }
      await sleep(1000 * attempt);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds the `registeredProducts` block for one crop by:
 *  1. Looking up which product regnos are registered for the crop's EPA
 *     site codes (bulk file, fast, comprehensive).
 *  2. Fetching per-product detail (active ingredients, label PDFs, status)
 *     for a capped sample of those regnos via the live PPLS JSON endpoint.
 *
 * `productsBySite` is loaded once and shared across all crops to avoid
 * re-parsing the ~2M-row bulk file per crop.
 */
export async function buildRegisteredProducts(
  crop: CropSourceMapping,
  productsBySite: Map<string, Set<string>>,
): Promise<RegisteredProducts> {
  const regnos = new Set<string>();
  for (const site of crop.epaSiteCodes) {
    for (const regno of productsBySite.get(site) ?? []) {
      regnos.add(regno);
    }
  }

  const sample = [...regnos].slice(0, MAX_PRODUCTS_PER_CROP);
  const ingredientMap = new Map<string, RegisteredActiveIngredient>();

  for (const regno of sample) {
    const detail = await fetchProductDetail(regno);
    await sleep(PRODUCT_DETAIL_DELAY_MS);
    if (!detail) continue;

    const labelLinks = (detail.pdffiles ?? [])
      .slice(0, 1) // most recent accepted label only
      .map((f) => `https://www3.epa.gov/pesticides/chem_search/ppls/${f.pdffile}`);

    for (const ai of detail.active_ingredients ?? []) {
      const key = ai.active_ing.trim().toLowerCase();
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, {
          name: ai.active_ing.trim(),
          epaRegistrationStatus: detail.product_status,
          labelLinks,
        });
      }
    }
  }

  return {
    sourceDate: new Date().toISOString().slice(0, 10),
    activeIngredients: [...ingredientMap.values()],
  };
}

export async function loadEpaProductsBySite(): Promise<Map<string, Set<string>>> {
  console.log("EPA PPIS: loading product-site index (prodsite.zip, ~2M rows)...");
  return loadProductsBySite();
}
