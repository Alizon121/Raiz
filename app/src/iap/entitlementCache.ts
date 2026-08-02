import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "premium_entitlement_cache";

// The App/Play Store is always the source of truth (see PremiumContext,
// which re-checks active subscriptions on every launch) — this is only a
// same-role-as-cropCache local mirror so the UI can render "ad-free" on the
// very first frame instead of flashing ads for the second or two the store
// check takes. Never throws; a miss/error just means "assume not premium
// until the real check resolves".
export async function getCachedIsPremium(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CACHE_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function setCachedIsPremium(isPremium: boolean): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, isPremium ? "true" : "false");
}
