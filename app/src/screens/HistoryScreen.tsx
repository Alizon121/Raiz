import { type NavigationProp, type ParamListBase, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import EmptyState from "../components/EmptyState";
import { getScanHistory } from "../services/scanHistory";
import type { ScanHistoryEntry } from "../types/scanHistory";
import { colors, radii, spacing, typography } from "../theme";

type State = "loading" | "error" | ScanHistoryEntry[];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [state, setState] = useState<State>("loading");

  // Refetches every time History becomes the focused tab, so a scan made
  // and confirmed elsewhere shows up without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      setState("loading");
      getScanHistory(user.uid)
        .then((entries) => !cancelled && setState(entries))
        .catch(() => !cancelled && setState("error"));
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>

      {state === "loading" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.forest} />
        </View>
      )}

      {state === "error" && (
        <EmptyState
          title="Something went wrong"
          body="We couldn't load your history right now. Check your connection and try again."
        />
      )}

      {Array.isArray(state) && state.length === 0 && (
        <EmptyState body="Start scanning to see a history of your scanned produce here" />
      )}

      {Array.isArray(state) && state.length > 0 && (
        <FlatList
          data={state}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("Scan", { screen: "ProduceDetail", params: { cropId: item.cropId } })}
            >
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>{item.cropName}</Text>
                <Text style={styles.rowMeta}>PLU {item.plu}</Text>
              </View>
              <Text style={styles.rowDate}>{formatDate(item.scannedAt)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.cream },
  title: { ...typography.title, color: colors.textPrimary, marginTop: spacing.xl, marginHorizontal: spacing.xl, marginBottom: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTextGroup: { flex: 1, paddingRight: spacing.sm },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: "600" },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowDate: { ...typography.caption, color: colors.textSecondary },
});
