import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import AdBanner from "../components/AdBanner";
import EmptyState from "../components/EmptyState";
import IconBadge from "../components/IconBadge";
import ScreenBackground from "../components/ScreenBackground";
import type { HistoryStackParamList } from "../navigation/types";
import { getScanHistory } from "../services/scanHistory";
import type { ScanHistoryEntry } from "../types/scanHistory";
import { colors, radii, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<HistoryStackParamList, "History">;
type State = "loading" | "error" | ScanHistoryEntry[];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
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
    <ScreenBackground style={styles.container}>
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
              onPress={() => navigation.navigate("ProduceDetail", { cropId: item.cropId })}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.rowImage} />
              ) : (
                <View style={styles.rowImage}>
                  <IconBadge name="leaf-outline" size={48} />
                </View>
              )}
              <View style={styles.rowTextGroup}>
                <Text style={styles.rowTitle}>{item.cropName}</Text>
                <Text style={styles.rowMeta}>PLU {item.plu}</Text>
              </View>
              <Text style={styles.rowDate}>{formatDate(item.scannedAt)}</Text>
              <Text style={styles.rowArrow}> {">"} </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <AdBanner placement="history" />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 32 },
  title: { ...typography.title, color: colors.textOnDark, marginTop: spacing.xl, marginHorizontal: spacing.xl, marginBottom: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
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
  rowImage: { width: 48, height: 48, borderRadius: radii.sm, marginRight: spacing.sm },
  rowTextGroup: { flex: 1, paddingRight: spacing.sm },
  rowTitle: { ...typography.body, color: colors.forest, fontWeight: "600" },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowDate: { ...typography.caption, color: colors.textSecondary },
  rowArrow: { ...typography.body, color: colors.textSecondary, marginLeft: 10 },
});
