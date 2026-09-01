import type { ChemicalUse, RegisteredProducts, ResidueData } from "../types/crop";

export type AuthStackParamList = {
  Onboarding: undefined;
  AuthWelcome: undefined;
  EmailAuth: { mode: "sign-in" | "sign-up" };
};

type PesticideInformationParams = {
  cropName: string;
  chemicalUse: ChemicalUse | null;
  registeredProducts: RegisteredProducts | null;
  residueData: ResidueData | null;
};

export type ScanStackParamList = {
  Scan: undefined;
  ScanConfirm: { plu: string };
  ManualEntry: undefined;
  ProduceDetail: { cropId: string };
  ResidueReductionTips: { cropName: string; tips: string[] };
  PesticideInformation: PesticideInformationParams;
};

// ProduceDetail/ResidueReductionTips/PesticideInformation are reachable from
// both the Scan tab (after a fresh scan) and the History tab (tapping a past
// scan) — each tab hosts its own stack instance of them so the back button
// returns to that tab's own root screen, not whatever was left on the other
// tab's stack.
export type HistoryStackParamList = {
  History: undefined;
  ProduceDetail: { cropId: string };
  ResidueReductionTips: { cropName: string; tips: string[] };
  PesticideInformation: PesticideInformationParams;
};

export type FavoritesStackParamList = {
  Favorites: undefined;
  ProduceDetail: { cropId: string };
  ResidueReductionTips: { cropName: string; tips: string[] };
  PesticideInformation: PesticideInformationParams;
};

export type SettingsStackParamList = {
  Settings: undefined;
  About: undefined;
  RemoveAds: undefined;
  DeleteAccount: undefined;
};