import { usePremium } from "../iap/PremiumContext";

export function useAdsEnabled(): boolean {
  const { isPremium } = usePremium();
  return !isPremium;
}
