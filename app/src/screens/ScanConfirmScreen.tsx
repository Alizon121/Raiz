import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { lookupCropByPlu } from "../services/cropLookup";
import { addScanHistoryEntry } from "../services/scanHistory";
import type { ScanStackParamList } from "../navigation/types";
import type { Crop } from "../types/crop";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<ScanStackParamList, "ScanConfirm">;
type LookupState = { status: "loading" } | { status: "found"; crop: Crop } | { status: "not-found" } | { status: "error" };

export default function ScanConfirmScreen({ route, navigation }: Props) {
  const { plu } = route.params;
  const { user } = useAuth();
  const [state, setState] = useState<LookupState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    lookupCropByPlu(plu)
      .then((crop) => {
        if (cancelled) return;
        setState(crop ? { status: "found", crop } : { status: "not-found" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [plu]);

  if (state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState title="Something went wrong" body={`We couldn't look up PLU ${plu} right now. Check your connection and try again.`}>
        <Button label="Try again" onPress={() => navigation.replace("ScanConfirm", { plu })} style={styles.button} />
        <Button label="Back to scan" variant="outline" onPress={() => navigation.navigate("Scan")} style={styles.button} />
      </EmptyState>
    );
  }

  if (state.status === "not-found") {
    return (
      <EmptyState
        title="We don't have data for that yet"
        body={`PLU ${plu} isn't in our database yet. Double-check the code, or try scanning again.`}
      >
        <Button label="Enter a different code" onPress={() => navigation.navigate("ManualEntry")} style={styles.button} />
        <Button label="Back to scan" variant="outline" onPress={() => navigation.navigate("Scan")} style={styles.button} />
      </EmptyState>
    );
  }

  const { crop } = state;
  return (
    <View style={styles.center}>
      <Text style={styles.readAs}>We read</Text>
      <Text style={styles.pluCode}>{plu}</Text>
      <Text style={styles.title}>{crop.cropName}</Text>
      <Text style={styles.body}>Is that right?</Text>
      <Button
        label="Yes, that's right"
        onPress={() => {
          // Fire-and-forget: history is a nice-to-have log, not something
          // that should block or fail the user's actual navigation forward.
          if (user) addScanHistoryEntry(user.uid, { cropId: crop.cropId, cropName: crop.cropName, plu }).catch(() => {});
          navigation.replace("ProduceDetail", { cropId: crop.cropId });
        }}
        style={styles.button}
      />
      <Button label="No, enter it manually" variant="outline" onPress={() => navigation.navigate("ManualEntry")} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
  readAs: { ...typography.caption, color: colors.textSecondary },
  pluCode: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
  button: { alignSelf: "stretch", marginBottom: spacing.md },
});
