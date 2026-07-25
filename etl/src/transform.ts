import { buildRegisteredProducts, loadEpaProductsBySite } from "./sources/epa.js";
import { buildResidueData, loadPdpDataset } from "./sources/pdp.js";
import { buildChemicalUse } from "./sources/quickstats.js";
import type { CropDoc, CropSourceMapping } from "./types.js";

const RESIDUE_REDUCTION_TIPS = [
  "Rinse produce under running water and rub gently while washing — this removes more residue than a still-water dip.",
  "Peeling removes residues concentrated on the skin, though it also removes fiber and some nutrients found there.",
  "Discard outer leaves on leafy vegetables such as lettuce and cabbage.",
  "Washing does not remove residues that have been absorbed into the flesh of the produce.",
];

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
      residueReductionTips: RESIDUE_REDUCTION_TIPS,
      lastUpdated: new Date().toISOString(),
    };
  }

  return docs;
}
