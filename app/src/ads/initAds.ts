import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { Platform } from "react-native";
import mobileAds, { AdsConsent, AdsConsentDebugGeography } from "react-native-google-mobile-ads";

// Forces the UMP SDK to treat this device as being in a specific region, so
// the consent flow can be exercised from anywhere — real geolocation is
// otherwise used, and outside a region requiring consent gatherConsent()
// correctly reports no form is required at all. Google only honors this for
// devices explicitly listed in testDeviceIdentifiers, so this can't affect
// real users even if it accidentally shipped — but it's still dev-only.
// See .env.example for how to find your device's ID (the SDK logs it on
// first run) and for switching between the EEA (GDPR) and US-state message.
const DEBUG_GEOGRAPHY_BY_NAME: Record<string, AdsConsentDebugGeography> = {
  EEA: AdsConsentDebugGeography.EEA,
  REGULATED_US_STATE: AdsConsentDebugGeography.REGULATED_US_STATE,
  OTHER: AdsConsentDebugGeography.OTHER,
};

const DEV_CONSENT_DEBUG_OPTIONS = __DEV__
  ? {
      debugGeography:
        DEBUG_GEOGRAPHY_BY_NAME[process.env.EXPO_PUBLIC_ADMOB_DEBUG_GEOGRAPHY ?? ""] ??
        AdsConsentDebugGeography.REGULATED_US_STATE,
      testDeviceIdentifiers: (process.env.EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS ?? "").split(",").filter(Boolean),
    }
  : undefined;

// Must run once, before the first ad request: gather UMP consent (required
// by Google for EEA/UK/Swiss users, harmless elsewhere), then — iOS only —
// ask for App Tracking Transparency so personalized ads are allowed. Ads
// still serve (non-personalized, lower-paying) if either is declined.
export async function initAds(): Promise<void> {
  try {
    await AdsConsent.gatherConsent(DEV_CONSENT_DEBUG_OPTIONS);
  } catch (error) {
    // A consent-gathering failure (e.g. no Privacy & messaging form
    // published yet in the AdMob console, or a network error) shouldn't
    // block ad serving entirely — fall through to non-personalized ads
    // rather than never initializing ads at all.
    console.warn("[ads] Failed to gather UMP consent, continuing without it:", error);
  }

  if (Platform.OS === "ios") {
    const { status } = await getTrackingPermissionsAsync();
    if (status === "undetermined") {
      await requestTrackingPermissionsAsync();
    }
  }

  await mobileAds().initialize();
}

// Dev-only testing helper (see SettingsScreen's "Reset ad consent" row).
// Consent, once obtained, is persisted by the UMP SDK on-device and won't
// re-prompt on its own — that's by design, not a bug — so re-testing the
// GDPR/US-states form requires explicitly clearing it first. Real users
// never see this; it's only wired up behind __DEV__.
export async function resetConsentForTesting(): Promise<void> {
  if (__DEV__ && DEV_CONSENT_DEBUG_OPTIONS?.testDeviceIdentifiers.length === 0) {
    // Without a registered test device ID, Google ignores debugGeography
    // entirely and falls back to real geolocation — outside the EEA/a
    // regulated US state, that silently means "no form needed," not an
    // error. This is the most common reason the form doesn't reappear.
    console.warn(
      "[ads] EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS is empty — debugGeography will be ignored and real geolocation " +
        "used instead. See .env.example for how to find your device's ID.",
    );
  }

  AdsConsent.reset();
  try {
    await AdsConsent.gatherConsent(DEV_CONSENT_DEBUG_OPTIONS);
  } catch (error) {
    console.warn("[ads] gatherConsent failed during reset:", error);
  }

  // gatherConsent() silently no-ops if it decides no form is needed or none
  // is available — log why, so "the form didn't appear" is diagnosable
  // instead of a silent no-op.
  const info = await AdsConsent.getConsentInfo();
  console.log("[ads] Consent info after reset:", info);
}
