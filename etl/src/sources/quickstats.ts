import type { ActiveIngredientUse, ChemicalUse, CropSourceMapping } from "../types.js";

const API_BASE = "https://quickstats.nass.usda.gov/api/api_GET/";
const DATA_AGE_WARNING_YEARS = 3;

// Verified against live responses (with a real QUICK_STATS_KEY):
//  - There is no "CHEMICAL USE" group_desc / no sector_desc filtering needed;
//    Ag Chemical Use rows show up under sector_desc=ENVIRONMENTAL with
//    whatever group_desc the commodity itself belongs to (e.g. apples are
//    "FRUIT & TREE NUTS"). Querying by commodity_desc + statisticcat_desc
//    alone returns them correctly.
//  - unit_desc varies by crop type: perennial/tree crops report
//    "PCT OF AREA BEARING, AVG"; annual crops report "PCT OF AREA PLANTED,
//    AVG". Both also come with 10TH/90TH PERCENTILE, MEDIAN, and CV PCT
//    variants we don't want — filter to unit_desc ending in ", AVG".
//  - domaincat_desc looks like "CHEMICAL, FUNGICIDE: (FLUAZINAM = 129098)" —
//    the ingredient name is before " = ", not the whole parenthetical.
//  - Rows with blank state_alpha are the national ("PROGRAM STATES")
//    aggregate; state-specific rows break the same value down by state.
//    We use the aggregate row's Value and collect the non-blank state_alpha
//    values (from any row) as sourceStates.
//  - Value can be "(D)" (withheld for disclosure) or "(NA)"/"(Z)" — filter
//    these out rather than coercing to 0, since 0 is a real, different value.
//  - domaincat_desc "(TOTAL)" is a category rollup ("any insecticide at
//    all"), not a real chemical — must be excluded or it shows up looking
//    like an active ingredient literally named "TOTAL".
//  - domain_desc includes non-pesticide categories (FERTILIZER, bare
//    CHEMICAL) that would pollute a "pesticide" list with things like
//    NITROGEN/PHOSPHATE/POTASH, and a "RESTRICTED USE CHEMICAL, X" variant
//    that duplicates the same active ingredient/value already reported
//    under the plain "CHEMICAL, X" domain (restricted-use is a subset flag,
//    not a separate measurement) — must filter to exactly the four plain
//    "CHEMICAL, {FUNGICIDE|HERBICIDE|INSECTICIDE|OTHER}" domains.
const PESTICIDE_DOMAINS = new Set([
  "CHEMICAL, FUNGICIDE",
  "CHEMICAL, HERBICIDE",
  "CHEMICAL, INSECTICIDE",
  "CHEMICAL, OTHER",
]);

interface QuickStatsRow {
  year: string;
  state_alpha: string;
  domain_desc: string;
  domaincat_desc: string;
  unit_desc: string;
  Value: string;
}

function extractIngredientName(domaincatDesc: string): string {
  const inner = domaincatDesc.match(/\(([^)]+)\)/)?.[1] ?? domaincatDesc;
  return inner.split("=")[0].trim();
}

function categorize(domaincatDesc: string): ActiveIngredientUse["category"] {
  const upper = domaincatDesc.toUpperCase();
  if (upper.includes("HERBICIDE")) return "herbicide";
  if (upper.includes("INSECTICIDE")) return "insecticide";
  if (upper.includes("FUNGICIDE")) return "fungicide";
  return "other";
}

function parseNumericValue(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null; // "(D)", "(NA)", "(Z)", etc.
  return Number(cleaned);
}

export async function buildChemicalUse(
  crop: CropSourceMapping,
  apiKey: string | undefined,
): Promise<ChemicalUse | null> {
  if (!apiKey) {
    console.warn(`  [quickstats] QUICK_STATS_KEY not set — skipping chemicalUse for ${crop.cropId}`);
    return null;
  }

  const params = new URLSearchParams({
    key: apiKey,
    commodity_desc: crop.quickStatsCommodity,
    statisticcat_desc: "TREATED",
    format: "JSON",
  });

  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { "User-Agent": "produce-pesticide-scanner-etl/0.1" },
  });
  if (!res.ok) {
    console.warn(`  [quickstats] ${crop.cropId}: HTTP ${res.status} — ${await res.text()}`);
    return null;
  }
  const body = (await res.json()) as { data?: QuickStatsRow[]; error?: string[] };
  if (!body.data || body.data.length === 0) {
    console.warn(`  [quickstats] ${crop.cropId}: no rows returned for statisticcat_desc=TREATED`);
    return null;
  }

  const avgRows = body.data.filter((r) => r.unit_desc.startsWith("PCT OF AREA") && r.unit_desc.endsWith(", AVG"));
  if (avgRows.length === 0) {
    console.warn(`  [quickstats] ${crop.cropId}: no "PCT OF AREA ..., AVG" rows found — check unit_desc values`);
    return null;
  }

  const latestYear = Math.max(...avgRows.map((r) => Number(r.year)));
  const rowsForLatestYear = avgRows.filter((r) => Number(r.year) === latestYear);

  const sourceStates = [...new Set(rowsForLatestYear.map((r) => r.state_alpha).filter(Boolean))].sort();

  const nationalRows = rowsForLatestYear.filter(
    (r) => !r.state_alpha && PESTICIDE_DOMAINS.has(r.domain_desc) && !r.domaincat_desc.includes("(TOTAL)"),
  );
  const parsed = nationalRows
    .map((r) => {
      const percentAcresTreated = parseNumericValue(r.Value);
      return percentAcresTreated === null
        ? null
        : {
            name: extractIngredientName(r.domaincat_desc),
            percentAcresTreated,
            category: categorize(r.domaincat_desc),
          };
    })
    .filter((ai): ai is ActiveIngredientUse => ai !== null && ai.percentAcresTreated > 0);

  // NASS sometimes tracks two distinct chemical IDs (different formulations/
  // salts) under the same display name (e.g. two "PERMETHRIN" entries with
  // different values). Collapse to one row per name, keeping the higher value.
  const byName = new Map<string, ActiveIngredientUse>();
  for (const ai of parsed) {
    const existing = byName.get(ai.name);
    if (!existing || ai.percentAcresTreated > existing.percentAcresTreated) byName.set(ai.name, ai);
  }

  const topActiveIngredients = [...byName.values()].sort((a, b) => b.percentAcresTreated - a.percentAcresTreated).slice(0, 10);

  return {
    sourceYear: latestYear,
    sourceStates,
    topActiveIngredients,
    dataAgeWarning: new Date().getFullYear() - latestYear > DATA_AGE_WARNING_YEARS,
  };
}
