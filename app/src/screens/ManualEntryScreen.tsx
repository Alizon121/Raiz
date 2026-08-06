import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import TextField from "../components/TextField";
import type { ScanStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";
import { isValidPluFormat } from "../utils/plu";

type Props = NativeStackScreenProps<ScanStackParamList, "ManualEntry">;

export default function ManualEntryScreen({ navigation }: Props) {
  const [plu, setPlu] = useState("");
  const trimmed = plu.trim();
  const valid = isValidPluFormat(trimmed);

  const submit = () => {
    if (!valid) return;
    navigation.navigate("ScanConfirm", { plu: trimmed });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter a PLU code</Text>
      <Text style={styles.body}>PLU codes are the 4-5 digit numbers printed on produce stickers.</Text>

      <TextField
        style={styles.input}
        placeholder="e.g. 4131"
        keyboardType="number-pad"
        maxLength={5}
        value={plu}
        onChangeText={setPlu}
        autoFocus
      />
      {trimmed.length > 0 && !valid && <Text style={styles.error}>PLU codes are 4 or 5 digits.</Text>}

      <Button label="Look it up" onPress={submit} disabled={!valid} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.background },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: "center" },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
  input: { fontSize: 24, textAlign: "center", letterSpacing: 4 },
  error: { color: colors.danger, textAlign: "center", marginBottom: spacing.md },
  button: { marginTop: spacing.md },
});
