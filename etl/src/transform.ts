import { buildRegisteredProducts, loadEpaProductsBySite } from "./sources/epa.js";
import { buildResidueData, loadPdpDataset } from "./sources/pdp.js";
import { buildChemicalUse } from "./sources/quickstats.js";
import type { CropDoc, CropSourceMapping } from "./types.js";

// Keyed by cropId, tailored to how each crop is actually handled/eaten —
// a thick-skinned crop like avocado (wash-before-cutting, to avoid a knife
// dragging surface residue into the flesh) needs fundamentally different
// advice than a thin-skinned one eaten whole like a cherry tomato. Falls
// back to DEFAULT_RESIDUE_REDUCTION_TIPS for any crop added to the seed
// list before it gets its own entry here.
const RESIDUE_REDUCTION_TIPS_BY_CROP: Record<string, string[]> = {
  apple: [
    "Rinse under running water and rub the skin gently — apples are often waxed, which can trap residue against the surface.",
    "A soft produce brush under running water reaches wax-coated skin better than rinsing alone.",
    "Peeling removes more residue than washing, but apple skin also carries most of the fruit's fiber.",
  ],
  potato: [
    "Scrub with a vegetable brush under running water — potatoes are grown in soil, so surface debris and residue need more than a rinse.",
    "Peeling removes the bulk of residue on root vegetables like potatoes, since it sits on skin that grew in direct contact with treated soil.",
    "If cooking potatoes unpeeled (roasting, baking), scrub thoroughly first — there's no washing it after it's cooked.",
  ],
  orange: [
    "Wash the peel before cutting or zesting — a knife dragged through an unwashed rind can carry residue onto the fruit inside.",
    "Most residue stays on the inedible peel and doesn't reach the segments you eat, as long as you wash before slicing.",
    "If using the zest, scrub the peel with a brush first — zest is the one part of the peel you actually consume.",
  ],
  "lettuce-head": [
    "Discard the outer leaves — they're directly exposed to spray and typically carry more residue than the inner leaves.",
    "Separate and rinse individual leaves under running water rather than rinsing the head whole; water needs to reach between the leaves.",
    "Dry leaves after washing — lingering moisture between leaves can also promote bacterial growth.",
  ],
  onion: [
    "The papery outer skin is discarded before eating and typically carries most of any surface residue with it.",
    "Rinse the onion after peeling, before cutting, to remove any residue on the outer flesh layer.",
    "Wash your cutting board and knife afterward — peeling can transfer residue from the outer skin onto them.",
  ],
  cucumber: [
    "Scrub with a produce brush under running water — cucumbers are frequently waxed, which can seal residue against the skin.",
    "Peeling removes more residue than washing alone, though much of a cucumber's fiber is in and just under the skin.",
    "Check for a wax coating (skin looks slightly shiny or feels tacky) — waxed cucumbers benefit the most from scrubbing over a plain rinse.",
  ],
  avocado: [
    "Scrub the outside under running water before cutting — a knife sliced through an unwashed avocado can drag surface residue and bacteria into the flesh.",
    "Most residue stays on the thick, inedible skin rather than the fruit itself, as long as you wash before — not after — cutting.",
    "Wash your hands after handling the skin and before touching the exposed flesh.",
  ],
  "tomato-cherry": [
    "Rinse under running water just before eating — cherry tomatoes are usually eaten whole and raw, skin included.",
    "Gently rub each tomato while rinsing; a quick dip doesn't remove as much surface residue as running water with light agitation.",
    "Wash right before eating rather than before storing — added moisture in storage can speed spoilage.",
  ],
};

const DEFAULT_RESIDUE_REDUCTION_TIPS = [
  "Rinse produce under running water and rub gently while washing — this removes more residue than a still-water dip.",
  "Peeling removes residues concentrated on the skin, though it also removes fiber and some nutrients found there.",
  "Washing does not remove residues that have been absorbed into the flesh of the produce.",
];

export function getResidueReductionTips(cropId: string): string[] {
  return RESIDUE_REDUCTION_TIPS_BY_CROP[cropId] ?? DEFAULT_RESIDUE_REDUCTION_TIPS;
}

export async function buildAllCropDocs(
  crops: CropSourceMapping[],
  nassApiKey: string | undefined,
): Promise<Record<string, CropDoc>> {
  const [productsBySite, pdpDataset] = await Promise.all([loadEpaProductsBySite(), loadPdpDataset()]);

  const docs: Record<string, CropDoc> = {};

  for (const crop of crops) {
    console.log(`Building crop doc: ${crop.cropId}`);

    const [chemicalUse, registeredProducts] = await Promise.all([
      buildChemicalUse(crop, nassApiKey),
      buildRegisteredProducts(crop, productsBySite),
    ]);
    const residueData = buildResidueData(crop, pdpDataset);

    docs[crop.cropId] = {
      cropName: crop.cropName,
      plu: crop.plu,
      commonAliases: crop.commonAliases,
      chemicalUse,
      registeredProducts,
      residueData,
      residueReductionTips: getResidueReductionTips(crop.cropId),
      lastUpdated: new Date().toISOString(),
    };
  }

  return docs;
}
