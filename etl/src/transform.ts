import { buildRegisteredProducts, loadEpaProductsBySite } from "./sources/epa.js";
import { buildResidueData } from "./sources/pdp.js";
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
    "Rinse under running water and rub the skin gently. Apples are often waxed, which can trap residue against the surface.",
    "A soft produce brush under running water reaches wax-coated skin better than rinsing alone.",
    "Peeling removes more residue than washing, but apple skin also carries most of the fruit's fiber.",
  ],
  potato: [
    "Scrub with a vegetable brush under running water. Potatoes are grown in soil, so surface debris and residue need more than a rinse.",
    "Peeling removes the bulk of residue on root vegetables like potatoes, since it sits on skin that grew in direct contact with treated soil.",
    "If cooking potatoes unpeeled (roasting, baking), scrub thoroughly first as there's no washing it after it's cooked.",
  ],
  orange: [
    "Wash the peel before cutting or zesting. A knife dragged through an unwashed rind can carry residue onto the fruit inside.",
    "Most residue stays on the inedible peel and doesn't reach the segments you eat, as long as you wash before slicing.",
    "If using the zest, scrub the peel with a brush first since zest is the one part of the peel you actually consume.",
  ],
  "lettuce-head": [
    "Discard the outer leaves since they're directly exposed to spray and typically carry more residue than the inner leaves.",
    "Separate and rinse individual leaves under running water rather than rinsing the head whole; water needs to reach between the leaves.",
    "Dry leaves after washing. Lingering moisture between leaves can also promote bacterial growth.",
  ],
  onion: [
    "The papery outer skin is discarded before eating and typically carries most of any surface residue with it.",
    "Rinse the onion after peeling, before cutting, to remove any residue on the outer flesh layer.",
    "Wash your cutting board and knife afterward. Peeling can transfer residue from the outer skin onto them.",
  ],
  cucumber: [
    "Scrub with a produce brush under running water. Cucumbers are frequently waxed, which can seal residue against the skin.",
    "Peeling removes more residue than washing alone, though much of a cucumber's fiber is in and just under the skin.",
    "Check for a wax coating (skin looks slightly shiny or feels tacky). Waxed cucumbers benefit the most from scrubbing over a plain rinse.",
  ],
  avocado: [
    "Scrub the outside under running water before cutting. A knife sliced through an unwashed avocado can drag surface residue and bacteria into the flesh.",
    "Most residue stays on the thick, inedible skin rather than the fruit itself, as long as you wash before (not after) cutting.",
    "Wash your hands after handling the skin and before touching the exposed flesh.",
  ],
  "tomato-cherry": [
    "Rinse under running water just before eating. Cherry tomatoes are usually eaten whole and raw, skin included.",
    "Gently rub each tomato while rinsing; a quick dip doesn't remove as much surface residue as running water with light agitation.",
    "Wash right before eating rather than before storing. Added moisture in storage can speed spoilage.",
  ],
  "lettuce-leaf": [
    "Separate the leaves and rinse each one individually under running water. Unlike a head, loose leaves have no outer layer to discard first.",
    "Soak briefly in a bowl of cold water, swishing gently, then rinse again under running water, which dislodges grit as well as surface residue.",
    "Dry thoroughly with a salad spinner or clean towel after washing; lingering moisture on leaf lettuce promotes wilting and bacterial growth fast.",
  ],
  blackberry: [
    "Rinse gently under running water just before eating. Blackberries are soft and bruise easily, so avoid rubbing or soaking them.",
    "Use a colander so water reaches all sides of the berries without you having to handle them roughly.",
    "Wash right before eating, not before storing. Added moisture significantly shortens how long fresh blackberries keep.",
  ],
  tomatillo: [
    "Remove the papery husk first. The husk is inedible and typically carries more residue than the fruit inside.",
    "The fruit itself is often sticky underneath the husk; rinse and rub gently under running water to remove that residue along with the surface film.",
    "Wash just before cooking or cutting, since a knife through an unwashed tomatillo can drag residue from the surface into the flesh.",
  ],
  pineapple: [
    "Scrub the outside under running water with a produce brush before cutting. A knife through an unwashed rind can carry surface residue into the fruit.",
    "The edible flesh is well protected by the thick, inedible rind, so residue reduction here matters most for the wash-before-cutting step, not the fruit itself.",
    "Wash your cutting board and knife afterward, since cutting through the rind can transfer residue onto them.",
  ],
  "sweet-corn": [
    "Remove the husk and silk before eating. Nearly all residue stays on the outer husk, which isn't eaten.",
    "Rinse the ear briefly under running water after husking, especially if any silk strands remain.",
    "Husking right before cooking, rather than washing husked corn ahead of time and storing it, keeps the kernels from drying out.",
  ],
  almond: [
    "Almonds are sold shelled and dried, not washed like fresh produce. Residue reduction here mainly comes down to the hull and shell being removed before you buy them.",
    "Rinsing raw almonds briefly under water before eating or using them in a recipe can remove any surface dust, though it won't affect residue absorbed during growing.",
    "Roasting has not been shown to meaningfully reduce pesticide residue on nuts. Treat washing as the only practical at-home step.",
  ],
  banana: [
    "Wash the peel before slicing or peeling. Hands and knives that touch an unwashed peel can transfer residue to the fruit inside.",
    "Most residue stays on the inedible peel, which is discarded, so the peeling process itself is the main transfer risk to guard against.",
    "There's no need to rinse a banana after peeling. Moisture at that point speeds browning without any real residue-reduction benefit.",
  ],
  grape: [
    "Rinse in a colander under running water, gently rubbing the grapes. Grapes grow in tight clusters, so residue can settle where the berries touch each other.",
    "A short soak (1-2 minutes) before rinsing can loosen residue trapped at those contact points better than a quick rinse alone.",
    "Remove grapes from the stem before washing rather than rinsing the whole bunch. The stem can shield some contact points from running water.",
  ],
  strawberry: [
    "Rinse gently under running water just before eating. Strawberries are porous and can absorb water, so avoid soaking them for long periods.",
    "Leave the green caps on while washing; removing them first exposes more of the porous flesh underneath to water and residue absorption.",
    "Wash right before eating, not before storing. Added moisture significantly shortens how long fresh strawberries keep.",
  ],
  carrot: [
    "Scrub with a vegetable brush under running water. Carrots grow in direct contact with soil, so residue and debris need more than a rinse.",
    "Peeling removes the outer layer where residue concentrates most, though carrot skin also holds some of the root's fiber and nutrients.",
    "Trim and discard the leafy green tops if still attached. The leafy portion isn't typically eaten and can carry their own separate residue.",
  ],
  broccoli: [
    "Soak briefly in a bowl of water with the florets facing down, then rinse under running water. Broccoli's tight florets can trap residue and debris that a quick rinse alone won't dislodge.",
    "Cut into smaller florets before washing so water reaches the surface area between the buds, not just the outside of the head.",
    "Wash just before cooking rather than before storing. broccoli left wet in the fridge develops soft spots faster.",
  ],
  "bell-pepper": [
    "Rinse under running water and rub the skin gently. Bell peppers are sometimes waxed, which can trap residue against the surface.",
    "Wash before cutting, not after. Slicing open an unwashed pepper can drag surface residue onto the inner flesh and seeds.",
    "Discard the seeds and white pith when cutting as they aren't typically eaten and go along with any residue that made it past the skin.",
  ],
  peach: [
    "Rinse under running water and rub the fuzzy skin gently. The fuzz can trap residue more than a smooth-skinned fruit would.",
    "Peeling removes more residue than washing alone, since peach skin is thin and residue sits close to the surface.",
    "Wash right before eating rather than before storing. Peaches bruise easily, and added moisture speeds spoilage.",
  ],
  cauliflower: [
    "Break into florets and soak briefly in a bowl of water, florets facing down, then rinse under running water. Tight florets can trap residue a quick rinse alone won't reach.",
    "Remove and discard the outer leaves before washing. The leaves are the most exposed part of the plant and typically carry the most residue.",
    "Cut away the thick core and stem, which aren't usually eaten anyway, before or after washing.",
  ],
  celery: [
    "Separate the stalks and rinse each one individually under running water since dirt and residue often collect where the stalks meet at the base.",
    "Scrub the base of the bunch with a produce brush; that's where the most soil-contact residue tends to concentrate.",
    "Trim the leafy tops and root end, which aren't typically eaten, before or after washing.",
  ],
  watermelon: [
    "Scrub the rind under running water with a produce brush before cutting. A knife dragged through an unwashed rind can carry surface residue into the flesh.",
    "Most residue stays on the thick, inedible rind rather than the fruit itself, as long as you wash before (not after) cutting.",
    "Wash your cutting board and knife afterward too, since cutting through the rind can transfer residue onto them.",
  ],
  mushroom: [
    "Wipe with a damp cloth or paper towel rather than soaking. Mushrooms are porous and absorb water quickly, which affects texture more than it removes residue.",
    "A quick rinse under running water followed by immediately drying works if wiping isn't practical. Avoid letting them sit in water.",
    "Trim the base of the stem, where growing-medium residue is most likely to concentrate.",
  ],
  cantaloupe: [
    "Scrub the netted rind under running water with a produce brush before cutting. The netting can trap residue that a plain rinse won't remove.",
    "Wash before cutting, not after. A knife dragged through an unwashed rind can carry surface residue into the edible flesh.",
    "Dry the rind after washing. Cutting through a wet rind can transfer surface moisture, and anything still in it, inward.",
  ],
  kiwi: [
    "Wash the fuzzy skin under running water and rub gently before peeling. Hands and utensils that touch an unwashed skin can transfer residue to the flesh inside.",
    "Peeling removes the skin most residue concentrates on, though some people eat kiwi skin and get more fiber by washing it thoroughly instead.",
    "If eating the skin, scrub gently with a soft produce brush. The fuzz can trap residue more than a smooth-skinned fruit would.",
  ],
  plum: [
    "Rinse under running water and rub the skin gently just before eating. Plums are eaten whole, skin included.",
    "A short soak can help loosen any waxy coating on the skin before rinsing.",
    "Wash right before eating rather than before storing. Added moisture speeds spoilage and bruising.",
  ],
  pear: [
    "Rinse under running water and rub the skin gently. Pears are often waxed like apples, which can trap residue against the surface.",
    "Peeling removes more residue than washing, but pear skin also carries much of the fruit's fiber.",
    "Wash right before eating, since pears bruise easily and added moisture speeds spoilage.",
  ],
  zucchini: [
    "Scrub with a produce brush under running water. Zucchini skin is thin and eaten whole, so surface residue isn't removed just by rinsing.",
    "Trim both ends before cooking. The stem and blossom ends aren't eaten and can carry more residue than the rest.",
    "Wash just before cooking rather than before storing. Zucchini left wet in the fridge softens and spoils faster.",
  ],
  "green-bean": [
    "Rinse in a colander under running water, tossing gently. Beans are eaten whole, pod included.",
    "Trim the stem end (and tail, if tough) before or after washing. It's not usually eaten and can carry more residue from where it attached to the plant.",
    "Wash just before cooking rather than before storing. Added moisture speeds spoilage in the fridge.",
  ],
  blueberry: [
    "Rinse in a colander under running water just before eating. Blueberries bruise easily, so avoid rubbing or soaking them for long periods.",
    "The pale, dusty coating on fresh blueberries is a natural wax (called bloom), not residue. A plain water rinse is enough to remove any actual residue sitting on top of it.",
    "Wash right before eating, not before storing. Added moisture significantly shortens how long fresh blueberries keep.",
  ],
  tomato: [
    "Rinse under running water and rub the skin gently just before eating. Tomatoes are eaten whole, skin included.",
    "Wash before cutting, not after. A knife dragged through an unwashed tomato can carry surface residue into the flesh and seeds inside.",
    "Remove the stem scar (the small hard spot where it attached to the vine) since it can trap more residue and dirt than the smooth skin around it.",
  ],
  eggplant: [
    "Rinse under running water and rub the skin gently. Eggplant skin is smooth and eaten along with the flesh, so surface residue isn't removed by rinsing alone.",
    "Wash before cutting, not after. A knife dragged through an unwashed eggplant can carry surface residue into the flesh.",
    "Trim the stem and cap before cooking. They aren't eaten and can carry more residue than the rest of the fruit.",
  ],
  tangerine: [
    "Wash the peel before peeling. Hands that touch an unwashed peel and then the fruit inside can transfer residue to the segments you eat.",
    "Most residue stays on the peel, which is discarded, so the peeling process itself is the main transfer risk to guard against.",
    "If using the zest, scrub the peel with a brush first, since zest is the one part of the peel you actually consume.",
  ],
  "winter-squash": [
    "Scrub the rind under running water with a produce brush before cutting. A knife dragged through an unwashed rind can carry surface residue into the flesh.",
    "Most residue stays on the thick, inedible rind rather than the flesh itself, as long as you wash before, not after, cutting.",
    "Wash your cutting board and knife afterward too, since cutting through the rind can transfer residue onto them.",
  ],
  "collard-greens": [
    "Separate the leaves and rinse each one individually under running water. Their broad, ridged surface can hold onto residue and grit more than a smooth leaf would.",
    "Soak briefly in a bowl of water, swishing gently, then rinse again under running water to dislodge grit trapped in the leaf ridges.",
    "Trim the tough center stem, which isn't always eaten and can carry more residue from where it attached to the plant.",
  ],
  radish: [
    "Scrub with a vegetable brush under running water. Radishes grow in direct contact with soil, so surface debris and residue need more than a rinse.",
    "Trim the leafy tops and root tail, which aren't typically eaten, before or after washing.",
    "Wash right before eating, not before storing. Added moisture shortens how long fresh radishes keep.",
  ],
};

const DEFAULT_RESIDUE_REDUCTION_TIPS = [
  "Rinse produce under running water and rub gently while washing as this removes more residue than a still-water dip.",
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
  const productsBySite = await loadEpaProductsBySite();

  const docs: Record<string, CropDoc> = {};

  for (const crop of crops) {
    console.log(`Building crop doc: ${crop.cropId}`);

    const [chemicalUse, registeredProducts, residueData] = await Promise.all([
      buildChemicalUse(crop, nassApiKey),
      buildRegisteredProducts(crop, productsBySite),
      buildResidueData(crop),
    ]);

    docs[crop.cropId] = {
      cropName: crop.cropName,
      plu: crop.plu,
      commonAliases: crop.commonAliases,
      chemicalUse,
      registeredProducts,
      residueData,
      residueReductionTips: getResidueReductionTips(crop.cropId),
      imageUrl: crop.imageUrl ?? null,
      lastUpdated: new Date().toISOString(),
    };
  }

  return docs;
}
