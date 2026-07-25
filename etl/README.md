# Produce Pesticide Scanner — ETL

Standalone pipeline that ingests USDA Ag Chemical Use (NASS Quick Stats), EPA
PPIS (pesticide product registration + site-of-use), and USDA/FDA PDP
(residue findings + tolerances), and writes normalized docs into the
`crops/{cropId}` Firestore collection described in the app's build spec.

This does not run per user request. Run it on a periodic refresh — monthly
is enough, since none of the three sources update more than weekly, and two
of them (Ag Chemical Use, PDP) are annual.

## Sources and how each is actually accessed

| Source | Method | Update cadence (observed) |
|---|---|---|
| EPA PPIS (site-of-use, registration) | Bulk file download (`prodsite.zip`, fixed-width, undocumented layout — verified by cross-referencing against `sitename.zip`) + live per-product JSON detail endpoint (`cswu/ppls/{regno}`, undocumented but stable) | `prodsite.zip` observed `Last-Modified` same-day; PPLS DB updates every 12h |
| USDA/FDA PDP (residue findings + tolerances) | Annual database zip download (`{YEAR}PDPDatabase.zip`), pipe-delimited text + xlsx reference tables, fully documented via the shipped data dictionary PDF | Annual, one zip per year |
| USDA NASS Quick Stats (Ag Chemical Use) | REST API, requires a free API key | Verified against live responses; observed dataset `load_time` refreshes as recently as same-week |

No HTML scraping anywhere in this pipeline — every source above is a bulk
file or REST endpoint intended for programmatic consumption.

## Setup

```
npm install
```

Environment variables — put these in `etl/.env` (auto-loaded via Node's
built-in `process.loadEnvFile()`, no `dotenv` dependency needed) or export
directly:

- `QUICK_STATS_KEY` — free key from https://quickstats.nass.usda.gov/api. Without
  it, `chemicalUse` is skipped (left `null`) and a warning is logged per crop.
- `FIREBASE_SERVICE_ACCOUNT_PATH` — path to a Firebase service account JSON
  (only needed for a real Firestore write, not for `--dry-run`).

## Running

```
npm run etl:dry-run   # writes output/{cropId}.json instead of touching Firestore
npm run etl           # writes to the `crops` collection in Firestore
```

Downloaded source files are cached under `.cache/` for 24h so repeated dev
runs don't re-fetch multi-hundred-MB files from EPA/USDA every time.

## Known caveats / what to verify next

1. **EPA `product.txt` bulk file is not parsed.** Its column layout is as
   undocumented as `prodsite.txt`, but rather than guess it, registration
   status/active-ingredient/label-PDF data comes from the live per-product
   JSON endpoint instead — verified, self-describing, no guessing. The
   tradeoff: it's capped at `MAX_PRODUCTS_PER_CROP` (15) products per crop
   with a 300ms delay between calls, since this endpoint's rate limits
   aren't documented anywhere. Raise the cap once you've watched it run
   against real usage without getting throttled.
2. **PDP only has data for crops it tested in a given year** — it rotates
   commodities, not every crop every year. `buildResidueData` returns `null`
   when a crop wasn't sampled in `PDP_YEAR` (2024). The 8 seed crops in
   `crops.seed.ts` were deliberately chosen from the crops confirmed present
   in the 2024 database. To cover crops outside that set, add a fallback
   that walks backward through prior years' zips until one has data, and
   surface the actual year used via `dataAgeWarning` (the field already
   exists in the schema for exactly this).
3. **`legalTolerance` can be `null`** — EPA sometimes has no numeric
   tolerance for a pesticide/commodity pair (`NT` = none, `EX` = exempt,
   `SU` = surface use only). `toleranceNote` carries which of those applies;
   the app's UI needs to handle a null tolerance gracefully rather than
   assuming every finding has one.
4. **Quick Stats field quirks, already handled but worth knowing about**:
   `domaincat_desc` mixes a category rollup row (literal `(TOTAL)`) in with
   individual chemicals, non-pesticide domains (`FERTILIZER`, bare
   `CHEMICAL`) alongside the four pesticide domains, a `RESTRICTED USE
   CHEMICAL, X` domain that duplicates the same value already reported under
   plain `CHEMICAL, X`, and occasionally two distinct chemical IDs sharing
   one display name with different values (e.g. two "PERMETHRIN" rows). All
   four are filtered/deduped in `quickstats.ts` — noted here in case a future
   crop surfaces a variant not seen in the 8-crop seed run.

## Extending the crop list

`src/crops.seed.ts` requires three codes verified per-crop:
- `epaSiteCodes`: look up in EPA's `sitename.zip` (site_code is the first 9
  characters of each line, name is the rest). Use the crop's
  **`(FOLIAR TREATMENT)`** variant, not `(ALL OR UNSPECIFIED)` — real
  registrations are filed against a specific application method, so the
  "unspecified" bucket is nearly empty (verified: e.g. avocado's unspecified
  code had 0 registered products vs. 990 under its foliar code; every crop
  checked showed foliar an order of magnitude ahead of the next method,
  soil treatment). Cross-check the count against `prodsite.zip` before
  committing to a code — don't assume "unspecified" or the first result is
  right.
- `pdpCommodityCodes`: from the `Commodity` sheet in a PDP year's
  `PDP ReferenceTables {YEAR}.xlsx`.
- `quickStatsCommodity`: the NASS `commodity_desc` value (typically the
  crop's plain English name, uppercased, e.g. `APPLES`).

Don't guess these — cross-reference against the actual downloaded files the
way this seed list was built, since none of these vocabularies are
consistent with each other or with common produce names.
