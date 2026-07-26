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
};
