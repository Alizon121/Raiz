import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ErrorCode, useIAP } from "expo-iap";
import { useAuth } from "../auth/AuthContext";
import { getCachedIsPremium, setCachedIsPremium } from "./entitlementCache";
import { REMOVE_ADS_SKU } from "./products";

interface PremiumContextValue {
  // True once the very first store entitlement check has resolved. Ads stay
  // hidden (see useAdsEnabled) from the cached value until then, so this is
  // only for RemoveAdsScreen to know whether it's safe to show real pricing.
  ready: boolean;
  isPremium: boolean;
  purchasing: boolean;
  restoring: boolean;
  // The subscription's display price, e.g. "$0.99" — null until the store
  // responds or if the product isn't found (e.g. not yet approved).
  displayPrice: string | null;
  purchaseError: string | null;
  restoreError: string | null;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

// expo-iap's thrown/reported errors are real Error instances with a `.code`
// (see createPurchaseError in its errorMapping util) — checked structurally
// since callers here only have `unknown` from a catch clause.
function isUserCancelled(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error as { code?: ErrorCode }).code === ErrorCode.UserCancelled;
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  // The store's own check (below) is authoritative and can resolve before or
  // after this cache read — a ref (not `ready` state, which wouldn't be
  // visible to this same effect's closure) makes sure whichever finishes
  // second doesn't blindly overwrite whichever finished first.
  const storeCheckSettledRef = useRef(false);

  useEffect(() => {
    getCachedIsPremium().then((cached) => {
      if (!storeCheckSettledRef.current) setIsPremium(cached);
    });
  }, []);

  // PremiumProvider is mounted once at the app root (see App.tsx) and never
  // unmounts across sign-out/sign-in, so without this a purchase/restore
  // error left over from one account would still be showing on
  // RemoveAdsScreen for the next account that signs in on the same device.
  useEffect(() => {
    setPurchaseError(null);
    setRestoreError(null);
  }, [user?.uid]);

  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    hasActiveSubscriptions,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      await finishTransaction({ purchase, isConsumable: false });
      setIsPremium(true);
      setCachedIsPremium(true);
      setPurchasing(false);
      setPurchaseError(null);
    },
    onPurchaseError: (error) => {
      setPurchasing(false);
      if (error.code !== ErrorCode.UserCancelled) {
        setPurchaseError(error.message);
      }
    },
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [REMOVE_ADS_SKU], type: "subs" });
    hasActiveSubscriptions([REMOVE_ADS_SKU]).then((active) => {
      storeCheckSettledRef.current = true;
      setIsPremium(active);
      setCachedIsPremium(active);
      setReady(true);
    });
  }, [connected, fetchProducts, hasActiveSubscriptions]);

  const subscription = subscriptions.find((s) => s.id === REMOVE_ADS_SKU) ?? null;

  const purchase = useCallback(async () => {
    setPurchasing(true);
    setPurchaseError(null);
    try {
      await requestPurchase({
        request: {
          apple: { sku: REMOVE_ADS_SKU },
          google: { skus: [REMOVE_ADS_SKU] },
        },
        type: "subs",
      });
      // On success, onPurchaseSuccess (above) is responsible for clearing
      // `purchasing` — it fires asynchronously once the store confirms the
      // transaction, which can be after this call already resolved.
    } catch (error) {
      setPurchasing(false);
      if (!isUserCancelled(error)) {
        setPurchaseError(error instanceof Error ? error.message : "Something went wrong while starting the purchase.");
      }
    }
  }, [requestPurchase]);

  const restore = useCallback(async () => {
    setRestoring(true);
    setRestoreError(null);
    try {
      await restorePurchases();
      const active = await hasActiveSubscriptions([REMOVE_ADS_SKU]);
      setIsPremium(active);
      setCachedIsPremium(active);
      if (!active) {
        setRestoreError("No active subscription found for this account.");
      }
    } catch (error) {
      if (isUserCancelled(error)) {
        setRestoreError("Request was not completed. Please try again.");
      } else {
        setRestoreError(error instanceof Error ? error.message : "Something went wrong while restoring your purchase.");
      }
    } finally {
      setRestoring(false);
    }
  }, [restorePurchases, hasActiveSubscriptions]);

  return (
    <PremiumContext.Provider
      value={{
        ready,
        isPremium,
        purchasing,
        restoring,
        displayPrice: subscription?.displayPrice ?? null,
        purchaseError,
        restoreError,
        purchase,
        restore,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium(): PremiumContextValue {
  const value = useContext(PremiumContext);
  if (!value) throw new Error("usePremium must be used within a PremiumProvider");
  return value;
}
