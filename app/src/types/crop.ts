// Mirrors etl/src/types.ts's CropDoc (the crops/{cropId} Firestore schema).
// Kept as a separate copy rather than a shared package since app/ and etl/
// are two independent projects with no shared build step — see
// app/README.md for the note to keep these two in sync by hand.

export interface ActiveIngredientUse {
  name: string;
  percentAcresTreated: number;
  category: "herbicide" | "insecticide" | "fungicide" | "other";
}

export interface ChemicalUse {
  sourceYear: number;
  sourceStates: string[];
  topActiveIngredients: ActiveIngredientUse[];
  dataAgeWarning: boolean;
}

export interface RegisteredActiveIngredient {
  name: string;
  epaRegistrationStatus: string;
  labelLinks: string[];
}

export interface RegisteredProducts {
  sourceDate: string;
  activeIngredients: RegisteredActiveIngredient[];
}

export interface ResidueFinding {
  chemical: string;
  percentSamplesDetected: number;
  medianConcentration: number;
  legalTolerance: number | null;
  toleranceNote: string | null;
  units: string;
}

export interface ResidueData {
  sourceYear: number;
  sampleSize: number;
  findings: ResidueFinding[];
  cumulativeExposureNote: string;
}

export interface CropDoc {
  cropName: string;
  plu: string[];
  commonAliases: string[];
  chemicalUse: ChemicalUse | null;
  registeredProducts: RegisteredProducts | null;
  residueData: ResidueData | null;
  residueReductionTips: string[];
  lastUpdated: Date; // stored as a Firestore Timestamp; converted to Date on read
}

/** A crop doc plus its Firestore document ID, as returned by cropLookup. */
export interface Crop extends CropDoc {
  cropId: string;
}
