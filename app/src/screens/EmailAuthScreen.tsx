import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import { signInWithEmail, signUpWithEmail } from "../auth/authService";
import type { AuthStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "EmailAuth">;

export default function EmailAuthScreen({ route, navigation }: Props) {
  const [mode, setMode] = useState(route.params.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await (mode === "sign-in" ? signInWithEmail(email, password) : signUpWithEmail(email, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{"‹ Back"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{mode === "sign-in" ? "Sign in" : "Create an account"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label={mode === "sign-in" ? "Sign in" : "Sign up"}
        onPress={submit}
        disabled={!email || !password}
        loading={busy}
        style={styles.submitButton}
      />

      <TouchableOpacity onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
        <Text style={styles.switchModeText}>
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.cream },
  back: { position: "absolute", top: 64, left: spacing.lg },
  backText: { color: colors.forest, fontSize: 16, fontWeight: "600" },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xl, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  error: { color: colors.danger, marginBottom: spacing.sm },
  submitButton: { marginTop: spacing.xs },
  switchModeText: { textAlign: "center", marginTop: spacing.lg, color: colors.forest, fontWeight: "600" },
});
