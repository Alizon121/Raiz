import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } from "react-native-google-mobile-ads";
import { resetConsentForTesting } from "../ads/initAds";
import { signOut } from "../auth/authService";
import { useAuth } from "../auth/AuthContext";
import AdBanner from "../components/AdBanner";
import { resetOnboarding } from "./OnboardingScreen";
import type { SettingsStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<SettingsStackParamList, "Settings">;

const PRIVACY_POLICY_URL = "https://github.com/Alizon121/Raiz/blob/main/PRIVACY_POLICY.md";

interface ActionRow {
  label: string;
  onPress: () => void;
  color?: string;
}

export default function SettingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  // Google requires GDPR-region users be able to revisit their ad-consent
  // choice after the fact, not just set it once at first launch — but the
  // row should only appear where a consent form was actually shown in the
  // first place (privacyOptionsRequirementStatus tracks that per-device).
  const [showAdPrivacyOptions, setShowAdPrivacyOptions] = useState(false);

  useEffect(() => {
    AdsConsent.getConsentInfo().then((info) => {
      setShowAdPrivacyOptions(info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED);
    });
  }, []);

  const infoRows = [
    user?.displayName ? { label: "Name", value: user.displayName } : null,
    user?.email ? { label: "Email", value: user.email } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  const aboutRow: ActionRow = { label: "About", onPress: () => navigation.navigate("About") };
  const privacyPolicyRow: ActionRow = { label: "Privacy Policy", onPress: () => Linking.openURL(PRIVACY_POLICY_URL) };
  const adPrivacyOptionsRow: ActionRow | null = showAdPrivacyOptions
    ? { label: "Ad Privacy Options", onPress: () => AdsConsent.showPrivacyOptionsForm() }
    : null;
  const removeAdsRow: ActionRow = { label: "Remove Ads", onPress: () => navigation.navigate("RemoveAds"), color: colors.forest };
  const signOutRow: ActionRow = { label: "Sign out", onPress: () => signOut(), color: colors.danger };
  const deleteAccountRow: ActionRow = {
    label: "Delete Account",
    onPress: () => navigation.navigate("DeleteAccount"),
    color: colors.danger,
  };
  // Dev-only: replays onboarding on next sign-out without uninstalling the app. Not shipped in prod builds.
  const devRow: ActionRow | null = __DEV__
    ? {
      label: "Replay onboarding (dev only)",
      onPress: async () => {
        await resetOnboarding();
        await signOut();
      },
    }
    : null;
  // Dev-only: consent, once obtained, persists on-device by design and won't
  // re-prompt on its own — this clears it so the GDPR/US-states form can be
  // re-tested without erasing the simulator or reinstalling the app.
  const resetConsentRow: ActionRow | null = __DEV__
    ? { label: "Reset ad consent (dev only)", onPress: () => resetConsentForTesting() }
    : null;
  const actionRows = [
    aboutRow,
    privacyPolicyRow,
    adPrivacyOptionsRow,
    removeAdsRow,
    signOutRow,
    deleteAccountRow,
    devRow,
    resetConsentRow,
  ].filter((row): row is ActionRow => row !== null);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>More</Text>

        <View style={styles.section}>
          <Text style={styles.subHeader}>Personal Information</Text>
          <View style={styles.card}>
            {infoRows.map((row, i) => (
              <View key={row.label} style={[styles.row, i === infoRows.length - 1 && styles.rowLast]}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            {actionRows.map((action, i) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                style={[styles.row, i === actionRows.length - 1 && styles.rowLast]}
              >
                <Text style={[styles.actionLabel, action.color && { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <AdBanner placement="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  section: { marginTop: spacing.lg },
  subHeader: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowLast: { paddingBottom: 0, marginBottom: 0, borderBottomWidth: 0 },
  infoLabel: { ...typography.body, fontWeight: "500", color: colors.textSecondary, flexShrink: 0, marginRight: spacing.sm },
  infoValue: { ...typography.body, fontWeight: "600", color: colors.forestDark, flexShrink: 1, textAlign: "right" },
  actionLabel: { ...typography.body, fontWeight: "600", color: colors.textPrimary },
});
