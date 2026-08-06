import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../theme";
import AdBanner from "../components/AdBanner";

// Reachable from both the Scan tab and the History tab — see the comment on
// HistoryStackParamList — so this is typed against just the params it
// reads, not one specific stack's full ParamList.
type Props = { route: { params: { cropName: string; tips: string[] } } };

export default function ResidueReductionTipsScreen({ route }: Props) {
  const { cropName, tips } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

      <AdBanner placement="residue" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  tip: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs, fontWeight: "500", paddingBottom: 20 },
});
