import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { colors, radii, spacing, typography } from "../theme";

// The purchase button is disabled until the in-app purchase flow (RevenueCat
// or a native IAP library — not yet decided) is wired up. This screen exists
// now so the Settings deeplink has somewhere real to go.
export default function RemoveAdsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Remove Ads</Text>
      <Text style={styles.body}>
        Raiz is free for everyone, supported by ads on non-critical screens. For $0.99/month you can remove all ads
        while keeping full access to every feature.
      </Text>

      <View style={styles.card}>
        <Text style={styles.planLabel}>Ad-free</Text>
        <Text style={styles.planPrice}>$0.99/month</Text>
      </View>

      <Button label="Coming soon" onPress={() => {}} disabled style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
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
  button: { alignSelf: "stretch" },
});
