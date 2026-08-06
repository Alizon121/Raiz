// Same product ID registered in both App Store Connect and Google Play
// Console — expo-iap's `apple`/`google` request props each take their own
// SKU list, but there's no requirement they differ, and reusing one ID
// keeps the two store listings easy to keep in sync by hand.
export const REMOVE_ADS_SKU = "remove_ads_monthly";
