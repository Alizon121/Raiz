import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { getCropById } from "../services/cropLookup";
import type { ScanStackParamList } from "../navigation/types";
import type { Crop } from "../types/crop";
import { colors, radii, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<ScanStackParamList, "ProduceDetail">;

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
        <Button label="Back to scan" onPress={() => navigation.navigate("Scan")} style={styles.backButton} />
      </EmptyState>
    );
  }

  const { chemicalUse, registeredProducts, residueData, residueReductionTips } = crop;

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
                <Text style={styles.rowLabel}>
                  {ai.name} <Text style={styles.rowMeta}>({ai.category})</Text>
                </Text>
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
            {residueData.findings.map((f) => (
              <View key={f.chemical} style={styles.row}>
                <View style={styles.rowTextGroup}>
                  <Text style={styles.rowLabel}>{f.chemical}</Text>
                  <Text style={styles.rowMeta}>
                    {f.percentSamplesDetected}% of samples · median {f.medianConcentration} {f.units}
                  </Text>
                </View>
                <Text style={styles.rowValue}>
                  {f.legalTolerance !== null ? `${f.legalTolerance} ${f.units} limit` : (f.toleranceNote ?? "—")}
                </Text>
              </View>
            ))}
          </View>
          {residueData.findings.length > 1 && <Text style={styles.footnote}>{residueData.cumulativeExposureNote}</Text>}
        </>
      ) : (
        <EmptySection text="No USDA/FDA residue testing data available for this crop yet." />
      )}

      {/* --- Residue-reduction tips --- */}
      {residueReductionTips.length > 0 && (
        <>
          <SectionLabel>Reducing Residue</SectionLabel>
          <View style={styles.card}>
            {residueReductionTips.map((tip) => (
              <Text key={tip} style={styles.tip}>
                • {tip}
              </Text>
            ))}
          </View>
        </>
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
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, padding: spacing.xl },
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
  tip: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  footer: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  footerLink: { ...typography.caption, color: colors.forest, fontWeight: "600", marginBottom: spacing.xs },
});
