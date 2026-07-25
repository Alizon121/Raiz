import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

// Placeholder for the Scan screen (Phase 3: camera barcode/PLU OCR + manual entry).
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="scan-outline" size={48} color={colors.forest} style={styles.icon} />
      <Text style={styles.title}>Scan</Text>
      <Text style={styles.body}>Barcode/PLU scanning lands in Phase 3.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream, padding: spacing.xl },
  icon: { marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
});
