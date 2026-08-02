import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

// One ad unit per placement (rather than reusing one ID everywhere) so
// AdMob reports per-screen performance separately. Falls back to Google's
// official test unit ID whenever a real one hasn't been set in .env yet, so
// dev builds always show fill without risking invalid-traffic flags from
// requesting real ads during development.
type Placement = "produceDetail" | "history" | "settings" | "removeAds";

const REAL_BANNER_UNIT_IDS: Record<Placement, string | undefined> = {
  produceDetail: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_PRODUCE_DETAIL,
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_PRODUCE_DETAIL,
  }),
  history: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_HISTORY,
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_HISTORY,
  }),
  settings: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_SETTINGS,
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_SETTINGS,
  }),
  removeAds: Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_REMOVE_ADS,
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_REMOVE_ADS,
  }),
};

export function getBannerAdUnitId(placement: Placement): string {
  return REAL_BANNER_UNIT_IDS[placement] || TestIds.BANNER;
}
