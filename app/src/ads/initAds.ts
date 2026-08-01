import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { Platform } from "react-native";
import mobileAds, { AdsConsent } from "react-native-google-mobile-ads";

// Must run once, before the first ad request: gather UMP consent (required
// by Google for EEA/UK/Swiss users, harmless elsewhere), then — iOS only —
// ask for App Tracking Transparency so personalized ads are allowed. Ads
// still serve (non-personalized, lower-paying) if either is declined.
export async function initAds(): Promise<void> {
  await AdsConsent.gatherConsent();

  if (Platform.OS === "ios") {
    const { status } = await getTrackingPermissionsAsync();
    if (status === "undetermined") {
      await requestTrackingPermissionsAsync();
    }
  }

  await mobileAds().initialize();
}
