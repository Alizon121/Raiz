import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { getBannerAdUnitId } from "../ads/adUnitIds";
import { useAdsEnabled } from "../ads/useAdsEnabled";

type Props = {
  placement: "produceDetail" | "history" | "settings" | "removeAds" | "residue";
};

// Renders nothing until the banner actually has a creative to show, so
// there's never an empty gray box reserving layout space before an ad
// loads (or if one fails to load).
export default function AdBanner({ placement }: Props) {
  const adsEnabled = useAdsEnabled();
  const [loaded, setLoaded] = useState(false);

  if (!adsEnabled) return null;

  return (
    <View style={loaded ? styles.container : undefined}>
      <BannerAd
        unitId={getBannerAdUnitId(placement)}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => setLoaded(true)}
        onAdFailedToLoad={() => setLoaded(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 16 },
});
