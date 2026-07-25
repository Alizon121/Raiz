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
    plu: ["4061", "4062"],
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
];
