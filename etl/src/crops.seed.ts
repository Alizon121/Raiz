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
    // Additional varieties confirmed live against plufinder.com (per-code
    // lookup, same standard as batches 1-6 below): 3283 Honeycrisp, 3284 Red
    // Delicious, 4020/4021 Golden Delicious (small/large), 4124 Empire, 4109
    // Crispin/Mutsu. (Existing 4131/4129 are both Fuji, 4130 is Pink
    // Lady/Cripps Pink, 4174 is Royal Gala per the same source — noted here
    // since it wasn't documented when this entry was first written.)
    plu: ["4131", "4130", "4129", "4174", "3000", "3283", "3284", "4020", "4021", "4124", "4109"],
    commonAliases: ["apple", "apples", "gala apple", "fuji apple"],
    quickStatsCommodity: "APPLES",
    epaSiteCodes: ["040010106"],
    pdpCommodityCodes: ["AP"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/300dpi/kesa/D3589-32.jpg"
  },
  {
    cropId: "potato",
    cropName: "Potatoes",
    // 4727 Yellow/Yukon Gold potato and 4723 Red Creamer potato confirmed
    // live against plufinder.com.
    plu: ["4072", "4073", "4083", "4727", "4723"],
    commonAliases: ["potato", "potatoes", "russet potato"],
    quickStatsCommodity: "POTATOES",
    epaSiteCodes: ["140130106"],
    pdpCommodityCodes: ["PO"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/featuredphoto/sep23/K9152-1p.jpg",
  },
  {
    cropId: "orange",
    cropName: "Oranges",
    // 4014 Valencia and 4381 Blood Orange confirmed live against
    // plufinder.com. 4196 was previously (incorrectly) listed here too —
    // re-verified live against plufinder.com and it actually resolves to
    // "Crimson Snow Apple," not any orange; removed.
    plu: ["4012", "3027", "4014", "4381"],
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
    // 4159 Vidalia and 4166 (generic) Sweet Onion confirmed live against
    // plufinder.com. (Existing 4082/4663/4093 are red/white/yellow onion
    // respectively per the same source.)
    plu: ["4082", "4663", "4093", "4159", "4166"],
    commonAliases: ["onion", "onions", "yellow onion"],
    quickStatsCommodity: "ONIONS",
    epaSiteCodes: ["140110107"],
    pdpCommodityCodes: ["ON"],
    imageUrl: "https://www.ars.usda.gov/ARSUserFiles/oc/graphics/photos/300dpi/kesa/d723-18.jpg"
  },
  {
    cropId: "cucumber",
    cropName: "Cucumbers",
    // 4594 Japanese/White cucumber and 4596 Gherkin/pickling cucumber
    // confirmed live against plufinder.com — both Cucumis sativus, same
    // species as the existing codes. (Armenian cucumber, PLU 4592, was
    // considered but NOT added: it's Cucumis melo var. flexuosus, a
    // different species, not a variety of this crop. Note also: existing
    // code 4184 returned a 404 on plufinder.com — could not confirm it live;
    // left in place since fixing existing entries is out of scope here.)
    plu: ["4062", "4593", "4594", "4596"],
    commonAliases: ["cucumber", "cucumbers"],
    quickStatsCommodity: "CUCUMBERS",
    epaSiteCodes: ["100100106"],
    pdpCommodityCodes: ["CU"],
    imageUrl: "https://images.pexels.com/photos/36727531/pexels-photo-36727531.jpeg"
  },
  {
    cropId: "avocado",
    cropName: "Avocado",
    // 3509 Gem avocado confirmed live against plufinder.com — same species
    // (Persea americana) as the existing Hass codes, different cultivar.
    plu: ["4046", "4225", "4770", "3509"],
    commonAliases: ["avocado", "avocados", "hass avocado"],
    quickStatsCommodity: "AVOCADOS",
    epaSiteCodes: ["280000106"],
    pdpCommodityCodes: ["AV"],
    imageUrl: "https://images.pexels.com/photos/19808829/pexels-photo-19808829.jpeg"
  },
  {
    cropId: "tomato-cherry",
    cropName: "Cherry Tomatoes",
    // 4796 Cherry Tomato (red), 4797 Cherry Tomato (yellow), and 4803
    // Teardrop Cherry Tomato (red) confirmed live against plufinder.com.
    // 4087 and 3363 were previously (incorrectly) listed here too —
    // re-verified live against plufinder.com: 4087 actually resolves to
    // "Tomato (Plum/Italian/Saladette/Roma - Red)", not cherry tomato, and
    // 3363 actually resolves to "Kensington Pride Mango," not any tomato at
    // all. Both removed.
    plu: ["4796", "4797", "4803"],
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
    // 4076 Green Leaf Lettuce and 4075 Red Leaf Lettuce confirmed live
    // against plufinder.com — these are the correct codes for this crop.
    // 4562 and 4564 were previously (incorrectly) listed here too —
    // re-verified live against plufinder.com and both actually resolve to
    // "Carrots," not any lettuce; removed.
    plu: ["4076", "4075"],
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
    // 3379 Mini/Baby Pineapple and 3380 Perola (golden-skin) Pineapple
    // confirmed live against plufinder.com — both Ananas comosus, same
    // commodity as existing 4430.
    plu: ["4430", "3379", "3380"],
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
    // 4078 Sweet Corn, Yellow confirmed live against plufinder.com (same
    // Zea mays sweet-corn commodity as existing 4077, White). Ornamental/
    // Indian corn PLUs (3085/3086) were considered but NOT added — those are
    // decorative field-corn products, not sweet corn.
    plu: ["4077", "4078"],
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
    // 4925 was also checked live against plufinder.com as a candidate
    // second code, but its page (like 4924's) doesn't specify raw whole/
    // shelled vs. a processed form — same unconfirmed status as 4924, so
    // not added.
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
    // 4234 Baby (Nino/Lady Finger) Banana, 4229 Burro Banana, and 4230
    // Dominique Banana confirmed live against plufinder.com — all Musa
    // cultivars marketed simply as bananas, not plantains.
    plu: ["4011", "4234", "4229", "4230"],
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
    // 3531 Black Seedless and 3501 IFG Novelty Green Seedless (Cotton
    // Candy(R)) confirmed live against plufinder.com — both Vitis vinifera
    // table-grape cultivars.
    plu: ["4022", "4023", "3531", "3501"], // green/white seedless, red seedless, black seedless, cotton-candy green seedless
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
    // 4248 confirmed live against plufinder.com as an alternate
    // conventional code for the same garden strawberry commodity (quart
    // package size), distinct from existing 4247.
    plu: ["4247", "4248"],
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
    // 4560 Baby Carrots and 3424 Purple/Red Beta Sweet Carrot confirmed live
    // against plufinder.com (same Daucus carota commodity as existing 4565).
    plu: ["4565", "4560", "3424"],
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
    // 4079 (an alternate conventional/Calabrese code for the same commodity
    // as existing 4060) and 3277 Baby Broccoli (confirmed live: same species,
    // Brassica oleracea, an earlier harvest stage — not broccolini, which is
    // a different hybrid species) confirmed live against plufinder.com.
    plu: ["4060", "4079", "3277"],
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
    // 4689 Bell Pepper - Yellow (greenhouse) and 4682 Bell Pepper - Orange
    // (field grown) confirmed live against plufinder.com.
    plu: ["4065", "4688", "4689", "4682"], // green (field grown), red (greenhouse), yellow (greenhouse), orange (field grown)
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
    // 4038 Yellow Flesh Peach and 4401 White Flesh Peach confirmed live
    // against plufinder.com.
    plu: ["4044", "4038", "4401"],
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
    // Purple/green/orange (Romanesco-adjacent) cauliflower colors were
    // searched for on plufinder.com but no distinct live-confirmed PLU
    // turned up separate from this generic "all sizes" code — same
    // unconfirmed status as almond's PLU, so nothing added here.
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
    // PLU 3321 ("Celery Root/Celeriac with leaves attached") was checked
    // live on plufinder.com and NOT added — celeriac is grown/sold for its
    // root, a different retail product from stalk celery even though it
    // shares the same botanical species, closer to the "different item"
    // case than the "genuine variety" case per this file's own standard.
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
    // 4331 (Sugarbaby/Mickey Lee), 3421 (Mini Seedless), 3494 (Yellow Mini
    // Seedless), and 4341 (Yellow Seedless) confirmed live against
    // plufinder.com — all Citrullus lanatus, same commodity as existing
    // 4032 (Red Seedless).
    plu: ["4032", "4331", "3421", "3494", "4341"],
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
    // 4650 Portabella (a mature form of the same Agaricus bisporus species
    // as existing 4645 button mushroom) and 4648 Cremini/Brown/Swiss Brown
    // (also Agaricus bisporus, an intermediate maturity stage) confirmed
    // live against plufinder.com.
    plu: ["4645", "4650", "4648"],
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
    // 4050 Cantaloupe/Rockmelon confirmed live against plufinder.com as an
    // alternate conventional code for the same commodity as existing 4319.
    // Galia and Charentais melon codes were considered but NOT added — both
    // are distinct commercial melon types from cantaloupe/muskmelon, not a
    // variety of it.
    plu: ["4319", "4050"],
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
    // 3517 Gold Kiwi confirmed live against plufinder.com. Note: gold kiwi
    // is technically Actinidia chinensis vs. green kiwi's Actinidia
    // deliciosa — different species botanically, but sold and tracked
    // commercially as one "kiwifruit" commodity (NASS's quickStatsCommodity
    // below doesn't split them), so treated as a variety of this crop.
    plu: ["4030", "3517"],
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
    // 4039 (an alternate code for the same "Black Plums" group as existing
    // 4040) and 4042 (Red plums, e.g. Santa Rosa) confirmed live against
    // plufinder.com.
    plu: ["4040", "4039", "4042"],
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
    // 4024 Bartlett/Williams, 4413 Bosc, 4025 Anjou, and 4417 Red Anjou
    // confirmed live against plufinder.com. (Existing 3015 is specifically
    // "Clara Friis" winter/Danish pears per the same source — a real but
    // less common variety than these.)
    plu: ["3015", "4024", "4413", "4025", "4417"],
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
    // 4086 Yellow Zucchini (Golden Zucchini/Yellow Crookneck) confirmed live
    // against plufinder.com — same Cucurbita pepo commodity as existing
    // 4067, different color/shape.
    plu: ["4067", "4086"],
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
    // 4533 Wax/Yellow Bean and 3049 Fine (French-style) Green Bean confirmed
    // live against plufinder.com — both Phaseolus vulgaris, same succulent-
    // bean commodity as existing 4066.
    plu: ["4066", "4533", "3049"],
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
    // 3061 Beefsteak Tomato and 3282 Tomato (Roma/Plum/Italian/Saladette, On
    // the Vine) confirmed live against plufinder.com. Note: the more
    // "standard" 4-digit Roma code, 4087, was NOT added here even though
    // it's a genuine Roma-tomato PLU — plufinder.com shows it's already
    // (incorrectly) claimed by the tomato-cherry entry above, and the
    // PLU-uniqueness invariant means it can't be assigned to two crops; see
    // the flag on tomato-cherry's entry.
    plu: ["4664", "3061", "3282"],
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
    // 4601 Japanese Eggplant and 4602 White Eggplant confirmed live against
    // plufinder.com — both Solanum melongena, same commodity as existing
    // 4081, different shape/color.
    plu: ["4081", "4601", "4602"],
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
    // 4450 Clementine and 3389 Satsuma confirmed live against plufinder.com
    // — both listed under plufinder's own "Tangerines/Mandarins" category
    // alongside existing 4457, matching this crop's "mandarin" alias.
    plu: ["4457", "4450", "3389"],
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
    // 4750 Acorn/Table Queen Squash and 4776 Vegetable Spaghetti (Spaghetti
    // Squash) confirmed live against plufinder.com — both fall under the
    // same generic "SQUASH" NASS/PDP bucket as butternut (see note above),
    // so treated as additional varieties of this crop rather than separate
    // items.
    plu: ["4759", "4750", "4776"],
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
    // 4089 (French Breakfast/Cherry Belle, bunched red) and 4598 (a broader
    // code plufinder.com lists as covering red/white/black/daikon radish)
    // confirmed live against plufinder.com — all Raphanus sativus.
    plu: ["4740", "4089", "4598"],
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
