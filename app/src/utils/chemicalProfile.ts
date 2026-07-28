import type { ActiveIngredientUse, ChemicalUse, ResidueData, ResidueFinding } from "../types/crop";

export type CategoryCounts = Record<ActiveIngredientUse["category"], number>;

/** How many of the crop's top active ingredients fall into each USDA category — the "at a glance" summary. */
export function countActiveIngredientsByCategory(chemicalUse: ChemicalUse | null): CategoryCounts {
  const counts: CategoryCounts = { insecticide: 0, fungicide: 0, herbicide: 0, other: 0 };
  if (!chemicalUse) return counts;
  for (const ai of chemicalUse.topActiveIngredients) counts[ai.category] += 1;
  return counts;
}

// A finding at or above this fraction of its legal tolerance gets called out
// separately, so a user doesn't have to do the division themselves across a
// long table to spot the ones worth a closer look. This is NOT a claim that
// findings below the line are "safe" — legal tolerances already build in a
// large margin (see the footnote on this screen) — it's purely "closest to
// the ceiling, look here first."
export const NEAR_TOLERANCE_THRESHOLD = 0.75;

export function findingsNearTolerance(residueData: ResidueData | null): ResidueFinding[] {
  if (!residueData) return [];
  return residueData.findings.filter(
    (f) => f.legalTolerance != null && f.legalTolerance > 0 && f.medianConcentration / f.legalTolerance >= NEAR_TOLERANCE_THRESHOLD,
  );
}

/** e.g. 0.715 / 15 -> 5 (percent, rounded). Only meaningful when legalTolerance is a positive number. */
export function percentOfTolerance(finding: ResidueFinding): number | null {
  if (finding.legalTolerance == null || finding.legalTolerance <= 0) return null;
  return Math.round((finding.medianConcentration / finding.legalTolerance) * 100);
}
