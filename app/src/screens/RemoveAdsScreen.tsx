import { useHeaderHeight } from "@react-navigation/elements";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AdBanner from "../components/AdBanner";
import Button from "../components/Button";
import ScreenBackground from "../components/ScreenBackground";
import { usePremium } from "../iap/PremiumContext";
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from "../legal";
import { colors, radii, spacing, typography } from "../theme";

export default function RemoveAdsScreen() {
  const headerHeight = useHeaderHeight();
  const { ready, isPremium, purchasing, restoring, displayPrice, purchaseError, restoreError, purchase, restore } =
    usePremium();

  if (isPremium) {
    return (
      <ScreenBackground style={[styles.container, { paddingTop: headerHeight }]}>
        <View style={styles.content}>
          <Text style={styles.title}>Remove Ads</Text>
          <Text style={styles.body}>You're all set! Ads are removed. Thanks for supporting Raiz!</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.content}>
        <Text style={styles.title}>Remove Ads</Text>
        <Text style={styles.body}>
          Subscribe to remove all ads while keeping full access to every feature.
        </Text>

        <View style={styles.card}>
          <Text style={styles.planLabel}>Ad-free — Monthly subscription</Text>
          <Text style={styles.planPrice}>{displayPrice ?? "$0.99"} / month</Text>
          <Text style={styles.planTerms}>
            Auto-renews monthly until canceled. Cancel anytime in your App Store account settings.
          </Text>
        </View>

        {purchaseError && <Text style={styles.errorText}>{purchaseError}</Text>}

        <Button
          label={purchasing ? "Processing…" : "Subscribe"}
          onPress={purchase}
          disabled={!ready || purchasing || restoring}
          loading={purchasing}
          style={styles.button}
        />

        {restoreError && <Text style={styles.errorText}>{restoreError}</Text>}

        <TouchableOpacity onPress={restore} disabled={!ready || purchasing || restoring} style={styles.restoreRow}>
          <Text style={styles.restoreText}>{restoring ? "Restoring…" : "Restore purchases"}</Text>
        </TouchableOpacity>

        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_USE_URL)}>
            <Text style={styles.legalText}>Terms of Use</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AdBanner placement="removeAds" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.xl },
  title: { ...typography.h1, color: colors.textOnDark, marginTop: spacing.xl, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  planLabel: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
  planPrice: { ...typography.h2, color: colors.forestDark, marginTop: spacing.xs },
  planTerms: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  button: { alignSelf: "stretch" },
  restoreRow: { alignItems: "center", marginTop: spacing.lg },
  restoreText: { ...typography.body, color: colors.forest, fontWeight: "600" },
  legalRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.lg, gap: spacing.sm },
  legalText: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
  legalDivider: { ...typography.caption, color: colors.textSecondary },
});
