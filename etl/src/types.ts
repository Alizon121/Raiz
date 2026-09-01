// Mirrors the crops/{cropId} Firestore document shape from the build spec.

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
  legalTolerance: number | null; // null when EPA has no numeric tolerance (exempt / no-tolerance / surface-use)
  toleranceNote: string | null; // e.g. "Exempt from tolerance", "No tolerance established", "FDA Action Level"
  units: string;
}

export interface ResidueData {
  sourceYear: number;
  sampleSize: number;
  findings: ResidueFinding[];
  dataAgeWarning: boolean;
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
  imageUrl: string | null;
  lastUpdated: string; // ISO timestamp; converted to Firestore Timestamp at write time
}

// Crosswalk: how one crop maps into each source's own vocabulary/codes.
export interface CropSourceMapping {
  cropId: string;
  cropName: string;
  plu: string[];
  commonAliases: string[];
  /** USDA NASS Quick Stats `commodity_desc` value, e.g. "APPLES". */
  quickStatsCommodity: string;
  /** EPA PPIS site_code(s) (from sitename.txt) covering this crop's use sites. */
  epaSiteCodes: string[];
  /** USDA/FDA PDP two-letter COMMOD code(s), e.g. "AP" for apples. */
  pdpCommodityCodes: string[];
  /** Thumbnail shown on History rows. Not sourced from any of the government
   * datasets above — left unset until real photo assets/URLs are chosen. */
  imageUrl?: string | null;
}
