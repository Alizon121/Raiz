import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AdBanner from "../components/AdBanner";
import Button from "../components/Button";
import { usePremium } from "../iap/PremiumContext";
import { colors, radii, spacing, typography } from "../theme";

export default function RemoveAdsScreen() {
  const { ready, isPremium, purchasing, restoring, displayPrice, purchaseError, purchase, restore } = usePremium();

  if (isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Remove Ads</Text>
          <Text style={styles.body}>You're all set! Ads are removed. Thanks for supporting Raiz!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Remove Ads</Text>
        <Text style={styles.body}>
          Subscribe to remove all ads while keeping full access to every feature.
        </Text>

        <View style={styles.card}>
          <Text style={styles.planLabel}>Ad-free</Text>
          <Text style={styles.planPrice}>{displayPrice ?? "$0.99/month"}</Text>
        </View>

        {purchaseError && <Text style={styles.errorText}>{purchaseError}</Text>}

        <Button
          label={purchasing ? "Processing…" : "Subscribe"}
          onPress={purchase}
          disabled={!ready || purchasing || restoring}
          loading={purchasing}
          style={styles.button}
        />

        <TouchableOpacity onPress={restore} disabled={!ready || purchasing || restoring} style={styles.restoreRow}>
          <Text style={styles.restoreText}>{restoring ? "Restoring…" : "Restore purchases"}</Text>
        </TouchableOpacity>
      </View>

      <AdBanner placement="removeAds" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
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
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  button: { alignSelf: "stretch" },
  restoreRow: { alignItems: "center", marginTop: spacing.lg },
  restoreText: { ...typography.body, color: colors.forest, fontWeight: "600" },
});
