export type AuthStackParamList = {
  Onboarding: undefined;
  AuthWelcome: undefined;
  EmailAuth: { mode: "sign-in" | "sign-up" };
};

export type ScanStackParamList = {
  Scan: undefined;
  ScanConfirm: { plu: string };
  ManualEntry: undefined;
  ProduceDetail: { cropId: string };
  ResidueReductionTips: { cropName: string; tips: string[] };
};

// ProduceDetail/ResidueReductionTips are reachable from both the Scan tab
// (after a fresh scan) and the History tab (tapping a past scan) — each tab
// hosts its own stack instance of them so the back button returns to that
// tab's own root screen, not whatever was left on the other tab's stack.
export type HistoryStackParamList = {
  History: undefined;
  ProduceDetail: { cropId: string };
  ResidueReductionTips: { cropName: string; tips: string[] };
};
