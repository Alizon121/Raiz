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
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/300dpi/kesa/D3589-32.jpg"
  },
  {
    cropId: "potato",
    cropName: "Potatoes",
    plu: ["4072", "4073", "4083"],
    commonAliases: ["potato", "potatoes", "russet potato"],
    quickStatsCommodity: "POTATOES",
    epaSiteCodes: ["140130106"],
    pdpCommodityCodes: ["PO"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/featuredphoto/sep23/K9152-1p.jpg",
  },
  {
    cropId: "orange",
    cropName: "Oranges",
    plu: ["4012", "4196", "3027"],
    commonAliases: ["orange", "oranges", "navel orange"],
    quickStatsCommodity: "ORANGES",
    epaSiteCodes: ["020060106"],
    pdpCommodityCodes: ["OG"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/graphics/photos/300dpi/kesa/k3644-12.jpg"
  },
  {
    cropId: "lettuce-head",
    cropName: "Lettuce (Head)",
    plu: ["4061"], // 4062 was previously (incorrectly) listed here too — that's cucumber's PLU, not lettuce's
    commonAliases: ["lettuce", "iceberg lettuce", "head lettuce"],
    quickStatsCommodity: "LETTUCE",
    epaSiteCodes: ["130280106"],
    pdpCommodityCodes: ["LH"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/300dpi/kesa/D3416-1.jpg"
  },
  {
    cropId: "onion",
    cropName: "Onions",
    plu: ["4082", "4663", "4093"],
    commonAliases: ["onion", "onions", "yellow onion"],
    quickStatsCommodity: "ONIONS",
    epaSiteCodes: ["140110107"],
    pdpCommodityCodes: ["ON"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/graphics/photos/300dpi/kesa/d723-18.jpg"
  },
  {
    cropId: "cucumber",
    cropName: "Cucumbers",
    plu: ["4062", "4593", "4184"],
    commonAliases: ["cucumber", "cucumbers"],
    quickStatsCommodity: "CUCUMBERS",
    epaSiteCodes: ["100100106"],
    pdpCommodityCodes: ["CU"],
    imageUrl: "https://images.pexels.com/photos/36727531/pexels-photo-36727531.jpeg"
  },
  {
    cropId: "avocado",
    cropName: "Avocado",
    plu: ["4046", "4225", "4770"],
    commonAliases: ["avocado", "avocados", "hass avocado"],
    quickStatsCommodity: "AVOCADOS",
    epaSiteCodes: ["280000106"],
    pdpCommodityCodes: ["AV"],
    imageUrl: "https://images.pexels.com/photos/19808829/pexels-photo-19808829.jpeg"
  },
  {
    cropId: "tomato-cherry",
    cropName: "Cherry Tomatoes",
    plu: ["4087", "3363"],
    commonAliases: ["cherry tomato", "cherry tomatoes", "grape tomato"],
    quickStatsCommodity: "TOMATOES",
    epaSiteCodes: ["110050106"],
    pdpCommodityCodes: ["CT"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/300dpi/kesa/D4125-1.jpg"
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
    imageUrl: "https://images.pexels.com/photos/36165494/pexels-photo-36165494.jpeg"
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
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/featuredphoto/feb24/D3290-1L.jpg"
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
    imageUrl: "https://images.pexels.com/photos/33646203/pexels-photo-33646203.jpeg"
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
    imageUrl: "https://images.pexels.com/photos/12471181/pexels-photo-12471181.jpeg"
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
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/300dpi/kesa/D4938-1.jpg"
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
    imageUrl: "https://images.pexelsy/.com/photos/35339669/pexels-photo-35339669.jpeg"
  },

  // --- Batch 3: none of these six were tested by PDP in 2024, so this batch
  // is what actually exercised buildResidueData's multi-year fallback for
  // the first time against real data — and caught a real bug doing it:
  // parseReferenceTables only matched `.xlsx` entries, but every PDP annual
  // zip before 2024 ships its reference tables as legacy `.xls` instead, so
  // the fallback threw as soon as it reached 2023 instead of returning null.
  // Fixed in pdp.ts by switching from exceljs (xlsx-only) to the `xlsx`
  // (SheetJS) package, which reads both formats through one API.
  // epaSiteCodes/pdpCommodityCodes/quickStatsCommodity verified the same way
  // as batches 1-2, against live sitename.zip/prodsite.zip (foliar-treatment
  // code cross-checked for registered-product count same as before) and,
  // for pdpCommodityCodes specifically, against every PDP annual zip's
  // Commodity sheet from 2024 back through 2019 (since no single year's
  // sheet lists more than what PDP tested that year) — see per-crop notes
  // below for which year each code was actually found in.
  //
  // PLU codes cross-referenced against plufinder.com (a live per-code
  // lookup, not a hand-written blog listicle) rather than guessed from
  // memory — worth doing: an initial guess of 4325 for strawberries turned
  // out to already belong to muskmelon, and a well-circulated blog claim of
  // 4011 for carrots is actually banana's code. Still not the same tier of
  // verification as IFPS's own (non-bulk-fetchable) database, so treat
  // these as strong candidates to spot-check against a real sticker before
  // fully trusting, same caveat as almond's PLU above.
  {
    cropId: "banana",
    cropName: "Bananas",
    plu: ["4011"],
    commonAliases: ["banana", "bananas"],
    quickStatsCommodity: "BANANAS",
    epaSiteCodes: ["060020106"],
    // Found in the 2020 and 2019 Commodity sheets (not 2024-2021) — within
    // the 5-year fallback window, so residueData resolves via 2020.
    // chemicalUse will be null: NASS Quick Stats' Ag Chemical Use survey
    // returns HTTP 400 for BANANAS — no domestic-acreage survey exists for
    // a crop barely grown in the mainland US, a real gap like tomatillo's.
    pdpCommodityCodes: ["BN"],
    imageUrl: "https://images.pexels.com/photos/1093038/pexels-photo-1093038.jpeg",
  },
  {
    cropId: "grape",
    cropName: "Grapes",
    plu: ["4022", "4023"], // green/white seedless, red seedless
    commonAliases: ["grape", "grapes", "table grapes", "red grapes", "green grapes"],
    quickStatsCommodity: "GRAPES",
    epaSiteCodes: ["010140106"],
    // Found in the 2023 and 2022 Commodity sheets.
    pdpCommodityCodes: ["GR"],
    imageUrl: "https://images.pexels.com/photos/45209/purple-grapes-vineyard-napa-valley-napa-vineyard-45209.jpeg",
  },
  {
    cropId: "strawberry",
    cropName: "Strawberries",
    plu: ["4247"],
    commonAliases: ["strawberry", "strawberries"],
    quickStatsCommodity: "STRAWBERRIES",
    epaSiteCodes: ["010160106"],
    // No fresh-strawberry code appears in any 2024-2020 Commodity sheet —
    // only "Strawberries, Frozen" (SZ), and only as far back as 2019, which
    // is outside PDP_MAX_FALLBACK_YEARS' reach from 2024. Left empty rather
    // than guessing; residueData will be null for this crop until either the
    // fallback window is widened or PDP tests fresh strawberries again.
    pdpCommodityCodes: [],
    imageUrl: "https://images.pexels.com/photos/1143489/pexels-photo-1143489.jpeg",
  },
  {
    cropId: "carrot",
    cropName: "Carrots",
    plu: ["4565"],
    commonAliases: ["carrot", "carrots", "baby carrots"],
    quickStatsCommodity: "CARROTS",
    epaSiteCodes: ["140030106"],
    // Found in the 2022, 2021, and 2020 Commodity sheets.
    pdpCommodityCodes: ["CR"],
    imageUrl: "https://images.pexels.com/photos/73640/pexels-photo-73640.jpeg",
  },
  {
    cropId: "broccoli",
    cropName: "Broccoli",
    plu: ["4060"],
    commonAliases: ["broccoli", "broccoli crown", "broccoli florets"],
    quickStatsCommodity: "BROCCOLI",
    epaSiteCodes: ["130050106"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["BR"],
    imageUrl: "https://images.pexels.com/photos/161514/brocoli-vegetables-salad-green-161514.jpeg",
  },
  {
    cropId: "bell-pepper",
    cropName: "Bell Peppers",
    plu: ["4065", "4688"], // green (field grown), red (greenhouse)
    commonAliases: ["bell pepper", "bell peppers", "sweet pepper", "green pepper", "red pepper"],
    // NASS's Ag Chemical Use survey doesn't split pepper types the way
    // EPA/PDP do — "PEPPERS" is the broadest commodity_desc available, so
    // this crop's chemicalUse reflects all pepper types, not bell peppers
    // specifically. Same kind of imprecision as lettuce-head/lettuce-leaf
    // sharing one quickStatsCommodity.
    quickStatsCommodity: "PEPPERS",
    // (BELL) variant specifically, not the generic PEPPERS (FOLIAR
    // TREATMENT) code, which mixes in hot/chili/cooking pepper registrations.
    epaSiteCodes: ["110030107"],
    // Found in the 2021, 2020, and 2019 Commodity sheets as "Sweet Bell
    // Peppers".
    pdpCommodityCodes: ["PP"],
    imageUrl: "https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg",
  },

  // --- Batch 4: same verification process as batches 1-3 (live
  // sitename.zip/prodsite.zip for epaSiteCodes, every PDP annual zip's
  // Commodity sheet 2024-2019 for pdpCommodityCodes, live NASS vocabulary +
  // an actual buildChemicalUse call for quickStatsCommodity). Two crops
  // originally scouted for this batch — spinach and cabbage — were dropped:
  // neither has a PDP commodity code within the 5-year fallback window
  // (spinach has none at all in 2019-2024; cabbage's only code, CG, is
  // 2019-only, one year outside PDP_MAX_FALLBACK_YEARS' reach from 2024).
  // Swapped for mushroom and cantaloupe, which do.
  //
  // PLU codes verified individually against plufinder.com rather than
  // trusting the first search result — worth doing again: a "celery PLU"
  // search's top hits included 4067, which actually belongs to zucchini,
  // and 4325 briefly seemed plausible for something in this batch before
  // resolving to muskmelon. Same caveat as prior batches: this is a strong
  // candidate, not the same tier of verification as IFPS's own database.
  //
  // Every imageUrl below was fetched and visually inspected (not just
  // HTTP-200-checked) before being added — worth doing: one WebFetch
  // initially returned a peach photo's raw CDN URL that resolved fine as an
  // image but had the wrong photo ID for the page requested (turned out to
  // still be a peach, just not verified until actually viewed), and the
  // first mushroom candidate that looked right by title/description turned
  // out to be wild forest mushrooms on moss, not the cultivated white
  // button mushrooms PLU 4645 actually represents.
  {
    cropId: "peach",
    cropName: "Peaches",
    plu: ["4044"],
    commonAliases: ["peach", "peaches"],
    quickStatsCommodity: "PEACHES",
    epaSiteCodes: ["050040106"],
    // Found in the 2022 and 2021 Commodity sheets.
    pdpCommodityCodes: ["PC"],
    imageUrl: "https://images.pexels.com/photos/9265739/pexels-photo-9265739.jpeg",
  },
  {
    cropId: "cauliflower",
    cropName: "Cauliflower",
    plu: ["4571"],
    commonAliases: ["cauliflower"],
    quickStatsCommodity: "CAULIFLOWER",
    epaSiteCodes: ["130080106"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["CF"],
    imageUrl: "https://images.pexels.com/photos/38777777/pexels-photo-38777777.jpeg",
  },
  {
    cropId: "celery",
    cropName: "Celery",
    plu: ["4578"],
    commonAliases: ["celery", "celery stalks"],
    quickStatsCommodity: "CELERY",
    // 280030106, not the much weaker 130020103 "CELERY (LEAFY VEGETABLE)
    // (FOLIAR TREATMENT)" grouping (155 registered products vs. 2,768) —
    // same "check the count, don't take the first match" rule as always.
    epaSiteCodes: ["280030106"],
    // Found in the 2023, 2022, and 2021 Commodity sheets.
    pdpCommodityCodes: ["CE"],
    imageUrl: "https://images.pexels.com/photos/13044694/pexels-photo-13044694.jpeg",
  },
  {
    cropId: "watermelon",
    cropName: "Watermelon",
    plu: ["4032"],
    commonAliases: ["watermelon"],
    // NASS's Ag Chemical Use survey doesn't separate melon types — "MELONS"
    // is the only commodity_desc available, so this crop's chemicalUse
    // reflects all melons, not watermelon specifically. Cantaloupe below
    // shares the same commodity_desc for the same reason — same kind of
    // imprecision as lettuce-head/leaf and bell-pepper/PEPPERS.
    quickStatsCommodity: "MELONS",
    epaSiteCodes: ["100080106"],
    // Found in the 2023, 2022, and 2021 Commodity sheets.
    pdpCommodityCodes: ["WM"],
    imageUrl: "https://images.pexels.com/photos/17975572/pexels-photo-17975572.jpeg",
  },
  {
    cropId: "mushroom",
    cropName: "Mushrooms",
    plu: ["4645"],
    commonAliases: ["mushroom", "mushrooms", "button mushroom", "white mushroom"],
    // chemicalUse will be null: NASS Quick Stats returns HTTP 400 for
    // MUSHROOMS — no domestic Ag Chemical Use survey exists, same class of
    // gap as banana. Mushrooms are grown on compost substrate indoors, not
    // in open fields NASS's Ag Chemical Use survey covers.
    quickStatsCommodity: "MUSHROOMS",
    // 160030106 ("MUSHROOMS (FOLIAR TREATMENT)"), not 160031001 (a second,
    // much weaker code with the identical display name — 273 vs. 89
    // registered products) or 160030101 ("MUSHROOM BEDS ..." — the growing
    // substrate, not the mushroom itself).
    epaSiteCodes: ["160030106"],
    // Found in the 2023 and 2022 Commodity sheets.
    pdpCommodityCodes: ["MU"],
    imageUrl: "https://images.pexels.com/photos/12956096/pexels-photo-12956096.jpeg",
  },
  {
    cropId: "cantaloupe",
    cropName: "Cantaloupe",
    plu: ["4319"],
    commonAliases: ["cantaloupe", "muskmelon", "rockmelon"],
    // See watermelon's note — NASS doesn't split melon types, so this
    // shares the "MELONS" commodity_desc with watermelon above.
    quickStatsCommodity: "MELONS",
    epaSiteCodes: ["100020106"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["CN"],
    imageUrl: "https://images.pexels.com/photos/36450872/pexels-photo-36450872.jpeg",
  },

  // --- Batch 5: same verification process as batches 1-4. One crop
  // originally scouted for this batch — garlic — was dropped: despite a
  // strong EPA site code (1,545 registered products), it has no PDP
  // commodity code in any Commodity sheet from 2019-2024, unlike spinach/
  // cabbage in batch 4 which at least had one outside the fallback window.
  // Swapped for blueberry, which has a code reachable within
  // PDP_MAX_FALLBACK_YEARS.
  //
  // PLU codes verified individually against plufinder.com — caught another
  // wrong guess this batch: a "blueberries PLU" search's top hit, 4028,
  // actually belongs to strawberries.
  //
  // Every imageUrl fetched and visually inspected before being added, same
  // as batch 4 — no mismatches caught this round, but worth continuing
  // given batch 4 caught two.
  {
    cropId: "kiwi",
    cropName: "Kiwi",
    plu: ["4030"],
    commonAliases: ["kiwi", "kiwifruit", "kiwi fruit"],
    quickStatsCommodity: "KIWIFRUIT",
    epaSiteCodes: ["060180101"],
    // Found in the 2020 and 2019 Commodity sheets; only 2020 is within
    // PDP_MAX_FALLBACK_YEARS' reach from 2024.
    pdpCommodityCodes: ["KW"],
    imageUrl: "https://images.pexels.com/photos/6316511/pexels-photo-6316511.jpeg",
  },
  {
    cropId: "plum",
    cropName: "Plums",
    plu: ["4040"],
    commonAliases: ["plum", "plums"],
    quickStatsCommodity: "PLUMS",
    epaSiteCodes: ["050050106"],
    // Found in the 2023, 2022, and 2021 Commodity sheets.
    pdpCommodityCodes: ["PU"],
    imageUrl: "https://images.pexels.com/photos/17964695/pexels-photo-17964695.jpeg",
  },
  {
    cropId: "pear",
    cropName: "Pears",
    plu: ["3015"],
    commonAliases: ["pear", "pears"],
    quickStatsCommodity: "PEARS",
    epaSiteCodes: ["040030106"],
    // Found in the 2022 and 2021 Commodity sheets.
    pdpCommodityCodes: ["PE"],
    imageUrl: "https://images.pexels.com/photos/7586254/pexels-photo-7586254.jpeg",
  },
  {
    cropId: "zucchini",
    cropName: "Zucchini",
    plu: ["4067"],
    commonAliases: ["zucchini", "courgette", "summer squash"],
    // NASS's Ag Chemical Use survey doesn't split summer/winter squash or
    // zucchini specifically — "SQUASH" is the only commodity_desc
    // available, so this crop's chemicalUse reflects all squash types.
    // Same kind of imprecision as watermelon/cantaloupe sharing "MELONS".
    quickStatsCommodity: "SQUASH",
    epaSiteCodes: ["100120106"],
    // Found in the 2022, 2021, and 2020 Commodity sheets.
    pdpCommodityCodes: ["SS"],
    imageUrl: "https://images.pexels.com/photos/30340079/pexels-photo-30340079.jpeg",
  },
  {
    cropId: "green-bean",
    cropName: "Green Beans",
    plu: ["4066"],
    commonAliases: ["green bean", "green beans", "string beans", "snap beans"],
    // "BEANS" is the only relevant commodity_desc NASS exposes — it isn't
    // split by bean type the way EPA's site vocabulary (BEANS (SUCCULENT),
    // i.e. snap/green beans specifically) is, so chemicalUse here reflects
    // beans broadly, not green beans specifically.
    quickStatsCommodity: "BEANS",
    // "BEANS (SUCCULENT)" — succulent means fresh/green, harvested before
    // the pod dries, as opposed to dry beans (different site codes
    // entirely). This is the correct EPA grouping for fresh green beans.
    epaSiteCodes: ["150030111"],
    // Found in the 2022, 2021, and 2020 Commodity sheets.
    pdpCommodityCodes: ["GB"],
    imageUrl: "https://images.pexels.com/photos/34387471/pexels-photo-34387471.jpeg",
  },
  {
    cropId: "blueberry",
    cropName: "Blueberries",
    plu: ["4240"],
    commonAliases: ["blueberry", "blueberries"],
    quickStatsCommodity: "BLUEBERRIES",
    epaSiteCodes: ["010090106"],
    // Found in the 2022 and 2021 Commodity sheets.
    pdpCommodityCodes: ["BB"],
    imageUrl: "https://images.pexels.com/photos/12141497/pexels-photo-12141497.jpeg",
  },

  // --- Batch 6: candidates got noticeably harder to find. A full sweep of
  // every commodity in every 2020-2024 PDP Commodity sheet not already used
  // by an earlier batch turned up only a handful of real fresh-produce
  // codes (the rest were baby food, juice, or grain/butter/soybean
  // entries) — this batch is close to exhausting what's reachable within
  // PDP_MAX_FALLBACK_YEARS without loosening that window or accepting more
  // null-residueData crops like strawberry/cabbage/spinach.
  //
  // Regular tomatoes (as opposed to tomato-cherry, already seeded) turned
  // up a genuine EPA data limitation: sitename.zip has no separate
  // registration site for cherry tomatoes at all, so "tomato" here
  // legitimately shares tomato-cherry's exact epaSiteCode (110050106) —
  // documented and allowed as a one-off exception in crops.seed.test.ts
  // rather than silently violating the "no two crops share a site code"
  // invariant. PDP does distinguish them (TO vs. CT), so residueData still
  // differs between the two even though registeredProducts will be
  // identical. Winter squash, by contrast, does NOT collide with
  // zucchini/summer squash — 100140xxx is a genuinely separate EPA group
  // from zucchini's 100120xxx, verified in sitename.zip.
  //
  // Two crops (eggplant, radish) resolved chemicalUse from unusually old
  // NASS survey years (2010 and 2000 respectively) — real data, not
  // guessed, but expect dataAgeWarning: true on both; NASS simply hasn't
  // resurveyed Ag Chemical Use for these commodities recently.
  //
  // Image for collard greens took a second pass: the first candidate's
  // photo was captioned "kale and collard greens at a local market" but
  // was almost entirely kale in frame, with actual collards only a sliver
  // at the edge — swapped for an unambiguous shot after visual inspection.
  {
    cropId: "tomato",
    cropName: "Tomatoes",
    plu: ["4664"],
    commonAliases: ["tomato", "tomatoes", "vine tomato", "beefsteak tomato"],
    quickStatsCommodity: "TOMATOES",
    epaSiteCodes: ["110050106"],
    // Found in the 2023 and 2022 Commodity sheets.
    pdpCommodityCodes: ["TO"],
    imageUrl: "https://images.pexels.com/photos/35699715/pexels-photo-35699715.jpeg",
  },
  {
    cropId: "eggplant",
    cropName: "Eggplant",
    plu: ["4081"],
    commonAliases: ["eggplant", "aubergine"],
    // chemicalUse resolves, but from a 2010 survey year — expect
    // dataAgeWarning: true. NASS hasn't run an Ag Chemical Use survey for
    // eggplant since.
    quickStatsCommodity: "EGGPLANT",
    epaSiteCodes: ["110010106"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["EP"],
    imageUrl: "https://images.pexels.com/photos/12944629/pexels-photo-12944629.jpeg",
  },
  {
    cropId: "tangerine",
    cropName: "Tangerines",
    plu: ["4457"],
    commonAliases: ["tangerine", "tangerines", "mandarin", "mandarin orange"],
    quickStatsCommodity: "TANGERINES",
    epaSiteCodes: ["020080107"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["TA"],
    imageUrl: "https://images.pexels.com/photos/36791062/pexels-photo-36791062.jpeg",
  },
  {
    cropId: "winter-squash",
    cropName: "Winter Squash",
    // Butternut specifically (4759) — there's no single unambiguous
    // "winter squash, any variety" PLU the way there is for zucchini;
    // butternut is the most commonly purchased winter squash variety.
    plu: ["4759"],
    commonAliases: ["winter squash", "butternut squash", "squash"],
    // Same "SQUASH" commodity_desc as zucchini — see zucchini's note above.
    quickStatsCommodity: "SQUASH",
    // 100140106, a distinct EPA group from zucchini's 100120106 — EPA does
    // split summer vs. winter squash, unlike NASS.
    epaSiteCodes: ["100140106"],
    // Found in the 2021 and 2020 Commodity sheets.
    pdpCommodityCodes: ["WS"],
    imageUrl: "https://images.pexels.com/photos/36896657/pexels-photo-36896657.jpeg",
  },
  {
    cropId: "collard-greens",
    cropName: "Collard Greens",
    plu: ["4614"],
    commonAliases: ["collard greens", "collards"],
    // chemicalUse will be null: NASS Quick Stats has no "COLLARDS" or
    // similar commodity_desc in its vocabulary at all.
    quickStatsCommodity: "COLLARDS",
    epaSiteCodes: ["130090106"],
    // Found only in the 2020 Commodity sheet, the last year within
    // PDP_MAX_FALLBACK_YEARS' reach from 2024.
    pdpCommodityCodes: ["GL"],
    imageUrl: "https://images.pexels.com/photos/29829320/pexels-photo-29829320.jpeg",
  },
  {
    cropId: "radish",
    cropName: "Radishes",
    plu: ["4740"],
    commonAliases: ["radish", "radishes"],
    // chemicalUse resolves, but from a 2000 survey year (only 4 active
    // ingredients reported) — expect dataAgeWarning: true. The oldest
    // source year seen across every crop in this seed list so far.
    quickStatsCommodity: "RADISHES",
    epaSiteCodes: ["140140106"],
    // Found only in the 2020 Commodity sheet, the last year within
    // PDP_MAX_FALLBACK_YEARS' reach from 2024.
    pdpCommodityCodes: ["RD"],
    imageUrl: "https://images.pexels.com/photos/23826933/pexels-photo-23826933.jpeg",
  },
];
