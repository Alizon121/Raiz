import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

/**
 * Centered title/body layout for full-screen loading-failed, not-found, and
 * empty states — the same hierarchy every screen (ScanConfirm, ProduceDetail,
 * History) already used inline. Centralized here so they can't drift apart.
 */
export default function EmptyState({ title, body, children }: { title?: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.body}>{body}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
});
