import { useHeaderHeight } from "@react-navigation/elements";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme";
import AdBanner from "../components/AdBanner";
import ScreenBackground from "../components/ScreenBackground";

// Reachable from both the Scan tab and the History tab — see the comment on
// HistoryStackParamList — so this is typed against just the params it
// reads, not one specific stack's full ParamList.
type Props = { route: { params: { cropName: string; tips: string[]; organic?: boolean } } };

// The washing guidance below (and the organic note) is general food-safety
// advice from these publications, not data from the residue datasets.
const TIP_SOURCES = [
  { label: "Virginia Tech Extension: Do I Really Need to Wash That?", url: "https://pubs.ext.vt.edu/FST/fst-478/fst-478.html" },
  { label: "Tufts Health & Nutrition Letter: washing produce", url: "https://www.nutritionletter.tufts.edu/?p=161887" },
  { label: "EWG: How should I wash my fruits and veggies?", url: "https://oembed.ewg.org/news-insights/news/ask-ewg-how-should-i-wash-my-fruits-and-veggies" },
];

export default function ResidueReductionTipsScreen({ route }: Props) {
  const headerHeight = useHeaderHeight();
  const { cropName, tips, organic = false } = route.params;

  return (
    <ScreenBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.lg }]}>
        <Text style={styles.title}>Reducing Residue on {cropName}</Text>
        <Text style={styles.body}>
          General food-safety practices for this crop. These tips are not a guarantee of removal.
        </Text>

        <View style={styles.card}>
          {tips.map((tip) => (
            <Text key={tip} style={styles.tip}>
              {tip}
            </Text>
          ))}
        </View>

        {organic && (
          <View style={styles.organicNote}>
            <Text style={styles.organicNoteTitle}>Wash organic produce the same way</Text>
            <Text style={styles.organicNoteText}>
              Organic farming can still use approved pesticides, and an organic label doesn't mean produce is residue-free.
              Food-safety agencies advise washing organic produce.
            </Text>
          </View>
        )}

        <View style={styles.sources}>
          <Text style={styles.sourcesTitle}>Sources</Text>
          {TIP_SOURCES.map((source) => (
            <TouchableOpacity key={source.url} onPress={() => Linking.openURL(source.url)} accessibilityRole="link">
              <Text style={styles.sourceLink}>{source.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <AdBanner placement="residue" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.textOnDark, marginBottom: spacing.sm, textAlign: "center" },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  organicNote: { backgroundColor: colors.cautionBg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.caution, padding: spacing.md, marginTop: spacing.md },
  organicNoteTitle: { ...typography.body, color: colors.forestDark, fontWeight: "700", marginBottom: spacing.xs },
  organicNoteText: { ...typography.caption, color: colors.textPrimary },
  sources: { marginTop: spacing.lg },
  sourcesTitle: { color: colors.forestDark, fontWeight: "700", marginBottom: spacing.xs },
  sourceLink: { color: colors.sageBold, textDecorationLine: "underline", marginBottom: spacing.xs },
  tip: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs, fontWeight: "500", paddingBottom: 20 },
});
