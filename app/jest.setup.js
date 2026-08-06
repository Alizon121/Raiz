jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// react-native-google-mobile-ads requires a native TurboModule that isn't
// present under the jest test environment — stub the parts this app uses.
jest.mock("react-native-google-mobile-ads", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => ({ initialize: jest.fn().mockResolvedValue(undefined) }),
    BannerAd: (props) => React.createElement(View, { testID: "banner-ad", ...props }),
    BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: "ANCHORED_ADAPTIVE_BANNER" },
    TestIds: { BANNER: "test-banner-id" },
    AdsConsent: {
      gatherConsent: jest.fn().mockResolvedValue(undefined),
      getConsentInfo: jest.fn().mockResolvedValue({ privacyOptionsRequirementStatus: "NOT_REQUIRED" }),
      showPrivacyOptionsForm: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn(),
    },
    AdsConsentPrivacyOptionsRequirementStatus: { UNKNOWN: "UNKNOWN", REQUIRED: "REQUIRED", NOT_REQUIRED: "NOT_REQUIRED" },
    AdsConsentDebugGeography: { DISABLED: "DISABLED", EEA: "EEA", REGULATED_US_STATE: "REGULATED_US_STATE", OTHER: "OTHER" },
  };
});

jest.mock("expo-tracking-transparency", () => ({
  getTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: "undetermined" }),
  requestTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

// expo-iap requires a native module that isn't present under the jest test
// environment — stub useIAP with a "connected, nothing purchased" default so
// PremiumProvider (and anything nested under it, like AdBanner) can mount
// without a device/store. Tests that care about purchase behavior override
// individual return values via `require("expo-iap").useIAP.mockReturnValue(...)`.
//
// The functions below are hoisted out of the factory rather than created
// inline, because the real useIAP wraps them in useCallback (stable
// identity across renders) and PremiumContext depends on that stability —
// a fresh jest.fn() per render would retrigger its effects every render.
const mockFetchProducts = jest.fn();
const mockHasActiveSubscriptions = jest.fn().mockResolvedValue(false);
jest.mock("expo-iap", () => ({
  __esModule: true,
  ErrorCode: { UserCancelled: "user-cancelled" },
  useIAP: jest.fn(() => ({
    connected: true,
    subscriptions: [],
    fetchProducts: mockFetchProducts,
    requestPurchase: jest.fn().mockResolvedValue(undefined),
    finishTransaction: jest.fn().mockResolvedValue(undefined),
    hasActiveSubscriptions: mockHasActiveSubscriptions,
    restorePurchases: jest.fn().mockResolvedValue(undefined),
  })),
}));
