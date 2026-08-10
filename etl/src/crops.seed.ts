import type { CropSourceMapping } from "./types.js";

/**
 * Phase 1 seed set. Picked from crops confirmed present in BOTH:
 *  - the 2024 PDP annual database (PDP rotates commodities year to year,
 *    not every crop is tested every year)
 *  - EPA PPIS sitename.txt (site-of-use codes verified to exist)
 *
 * epaSiteCodes/pdpCommodityCodes were looked up directly against the live
 * source files, not guessed. See README for how to re-derive/extend this
 * list for additional crops.
 *
 * epaSiteCodes use the "(FOLIAR TREATMENT)" site variant, not the
 * "(ALL OR UNSPECIFIED)" one. Verified against live prodsite.zip: real
 * registrations are recorded against a specific application method, so the
 * "unspecified" bucket is nearly empty (e.g. avocado's unspecified code had
 * 0 registered products vs. 990 under its foliar-treatment code). Foliar is
 * the dominant method across every crop checked, by 1-2 orders of magnitude
 * over the next largest (soil treatment) — see git history / debug script
 * output for the comparison. EPA's site vocabulary also doesn't distinguish
 * retail forms like "cherry tomato" from the base crop, so tomato-cherry
 * maps to the plain TOMATOES site.
 */
export const CROP_SEED: CropSourceMapping[] = [
  {
    cropId: "apple",
    cropName: "Apples",
    plu: ["4131", "4130", "4129", "3000"],
    commonAliases: ["apple", "apples", "gala apple", "fuji apple"],
    quickStatsCommodity: "APPLES",
    epaSiteCodes: ["040010106"],
    pdpCommodityCodes: ["AP"],
  },
  {
    cropId: "potato",
    cropName: "Potatoes",
    plu: ["4072", "4073", "4083"],
    commonAliases: ["potato", "potatoes", "russet potato"],
    quickStatsCommodity: "POTATOES",
    epaSiteCodes: ["140130106"],
    pdpCommodityCodes: ["PO"],
  },
  {
    cropId: "orange",
    cropName: "Oranges",
    plu: ["4012", "4196", "3027"],
    commonAliases: ["orange", "oranges", "navel orange"],
    quickStatsCommodity: "ORANGES",
    epaSiteCodes: ["020060106"],
    pdpCommodityCodes: ["OG"],
  },
  {
    cropId: "lettuce-head",
    cropName: "Lettuce (Head)",
    plu: ["4061"], // 4062 was previously (incorrectly) listed here too — that's cucumber's PLU, not lettuce's
    commonAliases: ["lettuce", "iceberg lettuce", "head lettuce"],
    quickStatsCommodity: "LETTUCE",
    epaSiteCodes: ["130280106"],
    pdpCommodityCodes: ["LH"],
  },
  {
    cropId: "onion",
    cropName: "Onions",
    plu: ["4082", "4663", "4093"],
    commonAliases: ["onion", "onions", "yellow onion"],
    quickStatsCommodity: "ONIONS",
    epaSiteCodes: ["140110107"],
    pdpCommodityCodes: ["ON"],
  },
  {
    cropId: "cucumber",
    cropName: "Cucumbers",
    plu: ["4062", "4593", "4184"],
    commonAliases: ["cucumber", "cucumbers"],
    quickStatsCommodity: "CUCUMBERS",
    epaSiteCodes: ["100100106"],
    pdpCommodityCodes: ["CU"],
  },
  {
    cropId: "avocado",
    cropName: "Avocado",
    plu: ["4046", "4225", "4770"],
    commonAliases: ["avocado", "avocados", "hass avocado"],
    quickStatsCommodity: "AVOCADOS",
    epaSiteCodes: ["280000106"],
    pdpCommodityCodes: ["AV"],
  },
  {
    cropId: "tomato-cherry",
    cropName: "Cherry Tomatoes",
    plu: ["4087", "3363"],
    commonAliases: ["cherry tomato", "cherry tomatoes", "grape tomato"],
    quickStatsCommodity: "TOMATOES",
    epaSiteCodes: ["110050106"],
    pdpCommodityCodes: ["CT"],
  },

  // --- Batch 2: added once buildResidueData gained a multi-year PDP
  // fallback (PDP_LATEST_YEAR only tested 19 commodities in 2024; most of
  // these needed that to be viable at all). epaSiteCodes/pdpCommodityCodes/
  // quickStatsCommodity verified the same way as batch 1, against live
  // sitename.zip/prodsite.zip/PDP-2024/NASS Quick Stats.
  //
  // PLU codes were the one field NOT independently verified against a live
  // source when this batch was written — IFPS's own PLU lookup is a JS
  // search UI with no fetchable static listing. User spot-check caught two
  // wrong guesses (blackberry, tomatillo), now corrected below. Almond's
  // PLU is still an unconfirmed placeholder — see its entry.
  {
    cropId: "lettuce-leaf",
    cropName: "Leaf Lettuce",
    plu: ["4562", "4564"],
    commonAliases: ["leaf lettuce", "green leaf lettuce", "red leaf lettuce"],
    // Same NASS commodity as lettuce-head — Ag Chemical Use doesn't split
    // leaf vs. head, so both crops' chemicalUse will show identical figures.
    quickStatsCommodity: "LETTUCE",
    epaSiteCodes: ["130310106"],
    pdpCommodityCodes: ["LL"],
  },
  {
    cropId: "blackberry",
    cropName: "Blackberries",
    plu: ["4239"], // user-verified; 4232 (my initial guess) was wrong
    commonAliases: ["blackberry", "blackberries"],
    // NASS's most recent Ag Chemical Use survey year for blackberries is
    // 2017 — expect dataAgeWarning: true on this crop's chemicalUse; that's
    // correct/expected, not a bug in the pipeline.
    quickStatsCommodity: "BLACKBERRIES",
    epaSiteCodes: ["010020106"],
    pdpCommodityCodes: ["BK"],
  },
  {
    cropId: "tomatillo",
    cropName: "Tomatillos",
    plu: ["4801"], // user-verified; 4728 (my initial guess) was wrong
    commonAliases: ["tomatillo", "tomatillos", "husk tomato"],
    // Verified live: NASS Quick Stats has no Ag Chemical Use survey data for
    // tomatillos at all (HTTP 400 — not a recognized commodity_desc for
    // that dataset). chemicalUse will always be null for this crop; that's
    // a real gap in USDA's own data, not something buildChemicalUse can fix.
    quickStatsCommodity: "TOMATILLOS",
    epaSiteCodes: ["110080101"],
    pdpCommodityCodes: ["TT"],
  },
  {
    cropId: "pineapple",
    cropName: "Pineapple",
    plu: ["4430"],
    commonAliases: ["pineapple", "pineapples"],
    // Same situation as tomatillo — verified live, NASS has no Ag Chemical
    // Use data for pineapple; chemicalUse will always be null.
    quickStatsCommodity: "PINEAPPLES",
    epaSiteCodes: ["060130106"],
    pdpCommodityCodes: ["PN"],
  },
  {
    cropId: "sweet-corn",
    cropName: "Sweet Corn",
    plu: ["4077"],
    commonAliases: ["sweet corn", "corn", "corn on the cob"],
    // NASS distinguishes "CORN" (field/grain corn) from "SWEET CORN" — the
    // plain "CORN" query returns mostly irrelevant field-corn data, and
    // EPA's site vocabulary has the same split (see epaSiteCodes).
    quickStatsCommodity: "SWEET CORN",
    epaSiteCodes: ["150050106"],
    pdpCommodityCodes: ["CB"],
  },
  {
    cropId: "almond",
    cropName: "Almonds",
    // PLU still needs confirmation (see below) — 4030 is a placeholder, not
    // independently verified like the other three fields on this crop.
    plu: ["4924"],
    commonAliases: ["almond", "almonds"],
    quickStatsCommodity: "ALMONDS",
    epaSiteCodes: ["030010106"],
    // Verified live against Pdp24Samples.txt + the 2024 PDP Data Dictionary:
    // every "AL" sample has COMMTYPE=FR ("Fresh") — PDP tests raw/unroasted
    // almonds, not sliced, roasted, or almond butter. Use whichever PLU
    // represents raw whole/shelled almonds specifically.
    pdpCommodityCodes: ["AL"],
  },
];
