import { countActiveIngredientsByCategory, findingsNearTolerance, percentOfTolerance } from "../chemicalProfile";
import type { ChemicalUse, ResidueData } from "../../types/crop";

describe("countActiveIngredientsByCategory", () => {
  test("returns all-zero counts when chemicalUse is null", () => {
    expect(countActiveIngredientsByCategory(null)).toEqual({ insecticide: 0, fungicide: 0, herbicide: 0, other: 0 });
  });

  test("tallies each active ingredient into its category", () => {
    const chemicalUse: ChemicalUse = {
      sourceYear: 2025,
      sourceStates: [],
      dataAgeWarning: false,
      topActiveIngredients: [
        { name: "Carbaryl", percentAcresTreated: 51, category: "insecticide" },
        { name: "Acetamiprid", percentAcresTreated: 41, category: "insecticide" },
        { name: "Mancozeb", percentAcresTreated: 33, category: "fungicide" },
        { name: "Glyphosate", percentAcresTreated: 20, category: "herbicide" },
        { name: "Mineral Oil", percentAcresTreated: 41, category: "other" },
      ],
    };
    expect(countActiveIngredientsByCategory(chemicalUse)).toEqual({ insecticide: 2, fungicide: 1, herbicide: 1, other: 1 });
  });
});

const residueData = (findings: ResidueData["findings"]): ResidueData => ({
  sourceYear: 2024,
  sampleSize: 100,
  findings,
  dataAgeWarning: false,
  cumulativeExposureNote: "note",
});

describe("findingsNearTolerance", () => {
  test("returns an empty array when residueData is null", () => {
    expect(findingsNearTolerance(null)).toEqual([]);
  });

  test("excludes findings with no legal tolerance", () => {
    const data = residueData([
      { chemical: "NT Chemical", percentSamplesDetected: 1, medianConcentration: 5, legalTolerance: null, toleranceNote: "NT", units: "ppm" },
    ]);
    expect(findingsNearTolerance(data)).toEqual([]);
  });

  test("excludes findings comfortably under the threshold", () => {
    const data = residueData([
      { chemical: "Low", percentSamplesDetected: 1, medianConcentration: 1, legalTolerance: 15, toleranceNote: null, units: "ppm" },
    ]);
    expect(findingsNearTolerance(data)).toEqual([]);
  });

  test("includes findings at or above 75% of their legal tolerance", () => {
    const near = { chemical: "Near", percentSamplesDetected: 1, medianConcentration: 11.25, legalTolerance: 15, toleranceNote: null, units: "ppm" };
    const atLimit = { chemical: "AtLimit", percentSamplesDetected: 1, medianConcentration: 15, legalTolerance: 15, toleranceNote: null, units: "ppm" };
    const data = residueData([near, atLimit]);
    expect(findingsNearTolerance(data)).toEqual([near, atLimit]);
  });
});

describe("percentOfTolerance", () => {
  test("returns null when there's no legal tolerance", () => {
    expect(percentOfTolerance({ chemical: "x", percentSamplesDetected: 1, medianConcentration: 5, legalTolerance: null, toleranceNote: null, units: "ppm" })).toBeNull();
  });

  test("rounds the percentage of tolerance", () => {
    expect(percentOfTolerance({ chemical: "x", percentSamplesDetected: 1, medianConcentration: 0.715, legalTolerance: 15, toleranceNote: null, units: "ppm" })).toBe(5);
  });
});
