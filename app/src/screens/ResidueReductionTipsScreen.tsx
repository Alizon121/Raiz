import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScanStackParamList } from "../navigation/types";
import { colors, radii, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<ScanStackParamList, "ResidueReductionTips">;

export default function ResidueReductionTipsScreen({ route }: Props) {
  const { cropName, tips } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reducing Residue on {cropName}</Text>
      <Text style={styles.body}>
        General food-safety practices for this crop — not a response to any specific reading above, and not a
        guarantee of removal.
      </Text>

      <View style={styles.card}>
        {tips.map((tip) => (
          <Text key={tip} style={styles.tip}>
            {tip}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  tip: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs, fontWeight: "500", paddingBottom: 20 },
});
