import { Ionicons } from "@expo/vector-icons";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getCropById } from "../services/cropLookup";
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

function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SourceCaption({ children }: { children: ReactNode }) {
  return <Text style={styles.sourceCaption}>{children}</Text>;
}

function EmptySection({ text }: { text: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

export default function ProduceDetailScreen({ route, navigation }: Props) {
  const { cropId } = route.params;
  const [crop, setCrop] = useState<Crop | null | "loading" | "error">("loading");
  const [showSummaryInfo, setShowSummaryInfo] = useState(false);

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

  if (crop === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  if (crop === "error" || crop === null) {
    return (
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
    );
  }

  const { chemicalUse, registeredProducts, residueData, residueReductionTips } = crop;
  const categoryCounts = countActiveIngredientsByCategory(chemicalUse);
  const categoryEntries = (Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[])
    .map((category) => ({ category, count: categoryCounts[category] }))
    .filter(({ count }) => count > 0);
  const nearTolerance = findingsNearTolerance(residueData);
  const nearToleranceNames = new Set(nearTolerance.map((f) => f.chemical));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.cropName}>{crop.cropName}</Text>

      {/* Required on every result screen, not just onboarding: this is statistical/typical
          data for the crop type, not a lab test of the specific item scanned. */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="information-circle-outline" size={18} color={colors.forest} />
        <Text style={styles.disclaimerText}>
          This shows typical, statistical data for {crop.cropName.toLowerCase()} as a crop type — not a lab test of
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
      </View>

      {/* --- Common pesticide active ingredients (USDA Ag Chemical Use) --- */}
      <SectionLabel>Common Active Ingredients</SectionLabel>
      {chemicalUse ? (
        <>
          <SourceCaption>
            USDA NASS Quick Stats · {chemicalUse.sourceYear}
            {chemicalUse.sourceStates.length > 0 ? ` · ${chemicalUse.sourceStates.join(", ")}` : ""}
          </SourceCaption>
          {chemicalUse.dataAgeWarning && (
            <Text style={styles.warningText}>This data is more than 3 years old — treat it as a rough guide.</Text>
          )}
          <View style={styles.card}>
            {chemicalUse.topActiveIngredients.map((ai) => (
              <View key={ai.name} style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowLabel}>
                    {ai.name} <Text style={styles.rowMeta}>({ai.category})</Text>
                  </Text>
                </View>
                <Text style={styles.rowValue}>{ai.percentAcresTreated}% of acres</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footnote}>
            Based on USDA survey data for domestically grown {crop.cropName.toLowerCase()}. If this item was
            imported, these figures may not apply.
          </Text>
        </>
      ) : (
        <EmptySection text="No USDA Ag Chemical Use data available for this crop yet." />
      )}

      {/* --- Registered products/labels (EPA PPLS) --- */}
      <SectionLabel>Registered Products</SectionLabel>
      {registeredProducts && registeredProducts.activeIngredients.length > 0 ? (
        <>
          <SourceCaption>EPA Pesticide Product Label System · as of {registeredProducts.sourceDate}</SourceCaption>
          <Text style={styles.footnote}>
            "Registered" means legally permitted for use on this crop under EPA rules — it is not a safety judgment.
          </Text>
          <View style={styles.card}>
            {registeredProducts.activeIngredients.map((ai) => (
              <View key={ai.name} style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowLabel}>{ai.name}</Text>
                  <Text style={styles.rowMeta}>{ai.epaRegistrationStatus}</Text>
                </View>
                {ai.labelLinks[0] && (
                  <TouchableOpacity onPress={() => Linking.openURL(ai.labelLinks[0])}>
                    <Text style={styles.linkText}>Label</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </>
      ) : (
        <EmptySection text="No EPA registration data available for this crop yet." />
      )}

      {/* --- Residue findings vs. legal tolerance (USDA/FDA PDP) --- */}
      <SectionLabel>Residue Findings</SectionLabel>
      {residueData && residueData.findings.length > 0 ? (
        <>
          <SourceCaption>
            USDA/FDA Pesticide Data Program · {residueData.sourceYear} · {residueData.sampleSize} samples tested
          </SourceCaption>
          <Text style={styles.footnote}>
            Legal tolerances already include a large built-in safety margin — a detection below tolerance is not a
            near-miss.
          </Text>
          <View style={styles.card}>
            {residueData.findings.map((f) => {
              const isNearTolerance = nearToleranceNames.has(f.chemical);
              return (
                <View key={f.chemical} style={styles.row}>
                  <View style={styles.rowTextGroup}>
                    <Text style={styles.rowLabel}>
                      {f.chemical}
                      {isNearTolerance && <Text style={styles.nearToleranceTag}> Near limit</Text>}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {f.percentSamplesDetected}% of samples · median {f.medianConcentration} {f.units}
                    </Text>
                  </View>
                  <Text style={[styles.rowValue, isNearTolerance && styles.rowValueCaution]}>
                    {f.legalTolerance !== null ? `${f.legalTolerance} ${f.units} limit` : (f.toleranceNote ?? "—")}
                  </Text>
                </View>
              );
            })}
          </View>
          {residueData.findings.length > 1 && <Text style={styles.footnote}>{residueData.cumulativeExposureNote}</Text>}
        </>
      ) : (
        <EmptySection text="No USDA/FDA residue testing data available for this crop yet." />
      )}

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
  backButton: { alignSelf: "stretch" },
  cropName: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.md },
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
  nearToleranceTag: { ...typography.caption, color: colors.caution, fontWeight: "700" },
  rowValueCaution: { color: colors.caution },
  sectionLabel: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  sourceCaption: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  warningText: { ...typography.caption, color: colors.danger, marginBottom: spacing.xs },
  emptyText: { ...typography.body, color: colors.textSecondary, fontStyle: "italic" },
  footnote: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTextGroup: { flex: 1, paddingRight: spacing.sm },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowValue: { ...typography.caption, color: colors.textPrimary, fontWeight: "600" },
  linkText: { color: colors.forest, fontWeight: "600" },
  footer: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  footerLink: { ...typography.caption, color: colors.forest, fontWeight: "600", marginBottom: spacing.xs },
});
