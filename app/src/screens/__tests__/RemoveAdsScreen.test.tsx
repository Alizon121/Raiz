import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { useIAP } from "expo-iap";
import RemoveAdsScreen from "../RemoveAdsScreen";
import { PremiumProvider } from "../../iap/PremiumContext";
import { REMOVE_ADS_SKU } from "../../iap/products";

const mockUseIAP = useIAP as jest.Mock;

const mockRequestPurchase = jest.fn().mockResolvedValue(undefined);
const mockRestorePurchases = jest.fn().mockResolvedValue(undefined);
const mockFinishTransaction = jest.fn().mockResolvedValue(undefined);
const mockHasActiveSubscriptions = jest.fn().mockResolvedValue(false);
// Also hoisted, for the same reason as SUBSCRIPTIONS below: the real
// useIAP wraps this in useCallback (stable identity), and PremiumContext's
// effect depends on it — a fresh jest.fn() per render would retrigger that
// effect every render and stomp on isPremium after it's set to true.
const mockFetchProducts = jest.fn();

let capturedOptions: Parameters<typeof useIAP>[0];

// A stable reference (not a fresh array literal per render) — useIAP's real
// `subscriptions` comes from useState, so its identity only changes when the
// store responds, not on every re-render. A mock that reallocates it every
// call would make PremiumContext's `useEffect(..., [subscriptions])` loop
// forever, since it'd see a "new" array on every render it triggers.
const SUBSCRIPTIONS = [
  { id: REMOVE_ADS_SKU, displayPrice: "$0.99", currency: "USD", description: "", title: "", type: "subs", platform: "ios" },
];

beforeEach(async () => {
  jest.clearAllMocks();
  // The entitlement cache is written through the globally-mocked
  // AsyncStorage, whose in-memory store otherwise leaks a premium flag from
  // one test (e.g. the successful-purchase test) into the next.
  await AsyncStorage.clear();
  mockHasActiveSubscriptions.mockResolvedValue(false);
  mockUseIAP.mockImplementation((options) => {
    capturedOptions = options;
    return {
      connected: true,
      subscriptions: SUBSCRIPTIONS,
      fetchProducts: mockFetchProducts,
      requestPurchase: mockRequestPurchase,
      finishTransaction: mockFinishTransaction,
      hasActiveSubscriptions: mockHasActiveSubscriptions,
      restorePurchases: mockRestorePurchases,
    };
  });
});
afterEach(cleanup);

async function renderScreen() {
  await act(async () => {
    render(
      <PremiumProvider>
        <RemoveAdsScreen />
      </PremiumProvider>,
    );
  });
}

test("shows the subscription's store-reported price and a Subscribe button", async () => {
  await renderScreen();
  expect(screen.getByText("$0.99")).toBeTruthy();
  expect(screen.getByText("Subscribe")).toBeTruthy();
});

test("tapping Subscribe requests the purchase for both platforms' SKU", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Subscribe"));
  });
  expect(mockRequestPurchase).toHaveBeenCalledWith({
    request: { apple: { sku: REMOVE_ADS_SKU }, google: { skus: [REMOVE_ADS_SKU] } },
    type: "subs",
  });
});

test("a successful purchase finishes the transaction and switches to the ad-free thank-you state", async () => {
  await renderScreen();
  await act(async () => {
    await capturedOptions?.onPurchaseSuccess?.({ productId: REMOVE_ADS_SKU } as never);
  });
  expect(mockFinishTransaction).toHaveBeenCalledWith({ purchase: { productId: REMOVE_ADS_SKU }, isConsumable: false });
  expect(screen.getByText(/ads are removed/)).toBeTruthy();
});

test("shows the store's error message when a purchase fails for a reason other than user cancellation", async () => {
  await renderScreen();
  await act(async () => {
    capturedOptions?.onPurchaseError?.({ code: "network-error", message: "No connection" } as never);
  });
  expect(screen.getByText("No connection")).toBeTruthy();
});

test("silently ignores a user-cancelled purchase instead of showing an error", async () => {
  await renderScreen();
  await act(async () => {
    capturedOptions?.onPurchaseError?.({ code: "user-cancelled", message: "User cancelled" } as never);
  });
  expect(screen.queryByText("User cancelled")).toBeNull();
});

test("tapping Restore purchases re-checks entitlement", async () => {
  await renderScreen();
  await act(async () => {
    fireEvent.press(screen.getByText("Restore purchases"));
  });
  expect(mockRestorePurchases).toHaveBeenCalledTimes(1);
  expect(mockHasActiveSubscriptions).toHaveBeenCalledWith([REMOVE_ADS_SKU]);
});

test("shows the ad-free thank-you state immediately when the store already reports an active subscription", async () => {
  mockHasActiveSubscriptions.mockResolvedValue(true);
  await renderScreen();
  expect(screen.getByText(/ads are removed/)).toBeTruthy();
  expect(screen.queryByText("Subscribe")).toBeNull();
});
