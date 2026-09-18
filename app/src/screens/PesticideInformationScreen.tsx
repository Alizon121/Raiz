import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";
import AdBanner from "../components/AdBanner";
import ScreenBackground from "../components/ScreenBackground";
import { findingsNearTolerance } from "../utils/chemicalProfile";
import type { ChemicalUse, RegisteredProducts, ResidueData } from "../types/crop";
import { colors, radii, spacing, typography } from "../theme";

// The old (non-Fabric) Android renderer required this opt-in per-process;
// harmless no-op on iOS and on the new architecture, where it's on by default.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Reachable from both the Scan tab and the History tab — see the comment on
// HistoryStackParamList — so this is typed against just the params it
// reads, not one specific stack's full ParamList.
type Props = {
    route: {
        params: {
            cropName: string;
            chemicalUse: ChemicalUse | null;
            registeredProducts: RegisteredProducts | null;
            residueData: ResidueData | null;
        };
    };
};

function SourceCaption({ children }: { children: ReactNode }) {
    return <Text style={styles.sourceCaption}>{children}</Text>;
}

function EmptySection({ text }: { text: string }) {
    return <Text style={styles.emptyText}>{text}</Text>;
}

// Collapsed by default so the screen opens as a short, scannable list of
// section titles rather than every chemical/product/finding table at once —
// tapping a header reveals that section's detail.
function AccordionSection({ title, children }: { title: string; children: ReactNode }) {
    const [expanded, setExpanded] = useState(false);

    function toggle() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded((prev) => !prev);
    }

    return (
        <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={toggle} activeOpacity={0.7}>
                <Text style={styles.sectionLabel}>{title}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {expanded && <View style={styles.sectionBody}>{children}</View>}
        </View>
    );
}

export default function PesticideInformationScreen({ route }: Props) {
    const headerHeight = useHeaderHeight();
    const { cropName, chemicalUse, registeredProducts, residueData } = route.params;
    const nearTolerance = findingsNearTolerance(residueData);
    const nearToleranceNames = new Set(nearTolerance.map((f) => f.chemical));

    return (
        <ScreenBackground>
        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}>
            <Text style={styles.title}>Pesticide Information for {cropName}</Text>

            {/* --- Common pesticide active ingredients (USDA Ag Chemical Use) --- */}
            <AccordionSection title="Common Active Ingredients">
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
                        Based on USDA survey data for domestically grown {cropName.toLowerCase()}. If this item was imported,
                        these figures may not apply.
                    </Text>
                </>
            ) : (
                <EmptySection text="No USDA Ag Chemical Use data available for this crop yet." />
            )}
            </AccordionSection>

            {/* --- Registered products/labels (EPA PPLS) --- */}
            <AccordionSection title="Registered Products">
            {registeredProducts && registeredProducts.activeIngredients.length > 0 ? (
                <>
                    <SourceCaption>EPA Pesticide Product Label System · as of {registeredProducts.sourceDate}</SourceCaption>
                    <Text style={styles.footnote}>
                        "Registered" means legally permitted for use on this crop under EPA rules. It is NOT a safety judgment.
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
            </AccordionSection>

            {/* --- Residue findings vs. legal tolerance (USDA/FDA PDP) --- */}
            <AccordionSection title="Residue Findings">
            {residueData && residueData.findings.length > 0 ? (
                <>
                    <SourceCaption>
                        USDA/FDA Pesticide Data Program · {residueData.sourceYear} · {residueData.sampleSize} samples tested
                    </SourceCaption>
                    {residueData.dataAgeWarning && (
                        <Text style={styles.warningText}>This data is more than 3 years old — treat it as a rough guide.</Text>
                    )}
                    <Text style={styles.footnote}>
                        Disclaimer: Legal tolerances already include a large built-in safety margin, and a detection below tolerance should not be alarming
                        .
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
            </AccordionSection>
        </ScrollView>
        <AdBanner placement="pesticideInformation" />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { ...typography.h1, color: colors.textOnDark, marginBottom: spacing.md },
    section: { marginTop: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: spacing.md,
    },
    sectionBody: { paddingBottom: spacing.md },
    sectionLabel: { ...typography.h2, color: colors.textPrimary },
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
    rowValueCaution: { color: colors.caution },
    nearToleranceTag: { ...typography.caption, color: colors.caution, fontWeight: "700" },
    linkText: { color: colors.forest, fontWeight: "600" },
});
