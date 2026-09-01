import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import AdBanner from "../components/AdBanner";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import ScreenBackground from "../components/ScreenBackground";
import { getCropById } from "../services/cropLookup";
import { addFavorite, isFavorited, removeFavorite } from "../services/favorites";
import { deleteScanHistoryEntry } from "../services/scanHistory";
import { countActiveIngredientsByCategory, findingsNearTolerance, percentOfTolerance } from "../utils/chemicalProfile";
import type { ActiveIngredientUse, Crop } from "../types/crop";
import { colors, radii, spacing, typography } from "../theme";

const CATEGORY_LABELS: Record<ActiveIngredientUse["category"], string> = {
  insecticide: "insecticide",
  fungicide: "fungicide",
  herbicide: "herbicide",
  other: "other",
};

// Reachable from both the Scan tab and the History tab (see
// HistoryStackParamList) — typed loosely against whichever stack hosts it
// rather than one specific ParamList, since it only ever navigates to
// "ResidueReductionTips" (present in both) and calls goBack() otherwise.
type Props = {
  navigation: NavigationProp<ParamListBase>;
  route: { params: { cropId: string } };
};

const SOURCE_LINKS = [
  { label: "USDA NASS Quick Stats", url: "https://quickstats.nass.usda.gov" },
  { label: "EPA Pesticide Product Label System", url: "https://ordspub.epa.gov/ords/pesticides/f?p=PPLS:1" },
  { label: "USDA/FDA Pesticide Data Program", url: "https://www.ams.usda.gov/datasets/pdp" },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProduceDetailScreen({ route, navigation }: Props) {
  const headerHeight = useHeaderHeight();
  const { cropId } = route.params;
  const { user } = useAuth();
  const [crop, setCrop] = useState<Crop | null | "loading" | "error">("loading");
  const [showSummaryInfo, setShowSummaryInfo] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  function handleRemoveFromHistory(cropName: string) {
    if (!user) return;
    Alert.alert("Remove from history?", `This removes ${cropName} from your scan history.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setRemoving(true);
          deleteScanHistoryEntry(user.uid, cropId)
            .then(() => navigation.goBack())
            .catch(() => {
              setRemoving(false);
              Alert.alert("Something went wrong", "We couldn't remove this from your history. Check your connection and try again.");
            });
        },
      },
    ]);
  }

  useEffect(() => {
    let cancelled = false;
    setCrop("loading");
    getCropById(cropId)
      .then((result) => !cancelled && setCrop(result))
      .catch(() => !cancelled && setCrop("error"));
    return () => {
      cancelled = true;
    };
  }, [cropId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    isFavorited(user.uid, cropId)
      .then((result) => !cancelled && setFavorited(result))
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [user, cropId]);

  function handleToggleFavorite(cropName: string, imageUrl: string | null) {
    if (!user || togglingFavorite) return;
    setTogglingFavorite(true);
    const wasFavorited = favorited;
    // Optimistic — flip immediately, roll back if the write fails.
    setFavorited(!wasFavorited);
    const request = wasFavorited
      ? removeFavorite(user.uid, cropId)
      : addFavorite(user.uid, { cropId, cropName, imageUrl });
    request
      .catch(() => setFavorited(wasFavorited))
      .finally(() => setTogglingFavorite(false));
  }

  if (crop === "loading") {
    return (
      <ScreenBackground style={[styles.center, { paddingTop: headerHeight }]}>
        <ActivityIndicator color={colors.forest} />
      </ScreenBackground>
    );
  }

  if (crop === "error" || crop === null) {
    return (
      <ScreenBackground style={{ paddingTop: headerHeight }}>
        <EmptyState
          title={crop === null ? "Not found" : "Something went wrong"}
          body={
            crop === null
              ? "This item no longer has data available."
              : "We couldn't load this item right now. Check your connection and try again."
          }
        >
          <Button label="Go back" onPress={() => navigation.goBack()} style={styles.backButton} />
        </EmptyState>
      </ScreenBackground>
    );
  }

  const { chemicalUse, registeredProducts, residueData, residueReductionTips } = crop;
  const categoryCounts = countActiveIngredientsByCategory(chemicalUse);
  const categoryEntries = (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[])
    .map((category) => ({ category, count: categoryCounts[category] }))
    .filter(({ count }) => count > 0);
  const nearTolerance = findingsNearTolerance(residueData);

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}>
        <Text style={styles.cropName}>{crop.cropName}</Text>

        {/* Required on every result screen, not just onboarding: this is statistical/typical
          data for the crop type, not a lab test of the specific item scanned. */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.forest} />
          <Text style={styles.disclaimerText}>
            This shows typical, statistical data for {crop.cropName.toLowerCase()} as a crop type, and NOT a lab test of
            the specific item you scanned.
          </Text>
        </View>

        {/* --- At-a-glance summary: category counts + any residue findings worth a closer look --- */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Text style={styles.summaryTitle}>Chemical Profile at a Glance</Text>
            <TouchableOpacity
              onPress={() => setShowSummaryInfo((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="What does this summary show?"
              hitSlop={8}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {showSummaryInfo && (
            <Text style={styles.summaryInfoText}>
              Counts how many of this crop's top pesticide active ingredients fall into each category below, and flags
              any residue finding close to its legal tolerance — a quick overview before the full data further down.
            </Text>
          )}
          {categoryEntries.length > 0 ? (
            <View style={styles.summaryChips}>
              {categoryEntries.map(({ category, count }) => (
                <View key={category} style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>
                    {count} {CATEGORY_LABELS[category]}
                    {count === 1 ? "" : "s"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmptyText}>No chemical use data available yet for this crop.</Text>
          )}

          {residueData && residueData.findings.length > 0 && (
            nearTolerance.length > 0 ? (
              <View style={styles.cautionBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.caution} />
                <Text style={styles.cautionText}>
                  Worth a closer look — found at 75%+ of the legal tolerance:{" "}
                  {nearTolerance.map((f) => `${f.chemical} (${percentOfTolerance(f)}%)`).join(", ")}.
                </Text>
              </View>
            ) : (
              <View style={styles.clearBox}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.forestDark} />
                <Text style={styles.clearText}>No chemicals were found near their legal tolerance levels (75%+).</Text>
              </View>
            )
          )}

          {residueReductionTips.length > 0 && (
            <TouchableOpacity
              style={styles.summaryLinkRow}
              onPress={() => navigation.navigate("ResidueReductionTips", { cropName: crop.cropName, tips: residueReductionTips })}
            >
              <Text style={styles.summaryLinkText}>See tips to reduce residue</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.forest} />
            </TouchableOpacity>
          )}

          {chemicalUse && (
            <TouchableOpacity
              style={styles.summaryLinkRow}
              onPress={() => navigation.navigate("PesticideInformation", { cropName: crop.cropName, chemicalUse, registeredProducts, residueData })}
            >
              <Text style={styles.summaryLinkText}>Detailed Pesticide Information</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.forest} />
            </TouchableOpacity>
          )}

          {user && (
            <TouchableOpacity
              style={styles.summaryLinkRow}
              onPress={() => handleToggleFavorite(crop.cropName, crop.imageUrl)}
              disabled={togglingFavorite}
            >
              <Text style={favorited ? styles.removeText : styles.summaryLinkText}>
                {favorited ? "Remove from Favorites" : "Add to Favorites"}
              </Text>
              <Ionicons
                name={favorited ? "star" : "star-outline"}
                size={18}
                color={favorited ? colors.caution : colors.forest}
              />
            </TouchableOpacity>
          )}

          {user && (
            <TouchableOpacity
              style={styles.summaryLinkRow}
              onPress={() => handleRemoveFromHistory(crop.cropName)}
              disabled={removing}
            >
              <Text style={styles.removeText}>{removing ? "Removing…" : "Remove from History"}</Text>
              <Ionicons name="trash-outline" size={18} color={colors.caution} />
            </TouchableOpacity>
          )}
        </View>

        <AdBanner placement="produceDetail" />
        {/* --- Persistent source/date footer --- */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Data current as of {formatDate(crop.lastUpdated)}</Text>
          {SOURCE_LINKS.map((link) => (
            <TouchableOpacity key={link.url} onPress={() => Linking.openURL(link.url)}>
              <Text style={styles.footerLink}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  backButton: { alignSelf: "stretch" },
  cropName: { ...typography.title, color: colors.textOnDark, marginBottom: spacing.md },
  disclaimerBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: spacing.sm },
  summaryTitle: { ...typography.h2, color: colors.textPrimary },
  summaryInfoText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  summaryChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  summaryChip: { backgroundColor: colors.sageSubtle, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  summaryChipText: { ...typography.caption, color: colors.forestDark, fontWeight: "600" },
  summaryEmptyText: { ...typography.body, color: colors.textSecondary, fontStyle: "italic" },
  cautionBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.cautionBg,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  cautionText: { ...typography.caption, color: colors.caution, flex: 1 },
  clearBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.sageSubtle,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  clearText: { ...typography.caption, color: colors.forestDark, flex: 1 },
  summaryLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryLinkText: { ...typography.body, color: colors.forest, fontWeight: "600" },
  removeText: { ...typography.body, color: colors.caution, fontWeight: "600" },
  footer: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  footerLink: { ...typography.caption, color: colors.forest, fontWeight: "600", marginBottom: spacing.xs },
});
