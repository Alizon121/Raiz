import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import IconBadge from "../components/IconBadge";
import { signInWithApple, signInWithGoogle } from "../auth/authService";
import type { AuthStackParamList } from "../navigation/types";
import { colors, pastels, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "AuthWelcome">;

export default function AuthWelcomeScreen({ navigation }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    const appleSignInProvisioned = process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === "true";
    if (Platform.OS === "ios" && appleSignInProvisioned) {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const runAuthAction = async (action: () => Promise<unknown>) => {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconBadge name="leaf-outline" size={102} iconColor={colors.forest} />
        <Text style={styles.title}>Welcome to Raiz</Text>
      </View>

      <View style={styles.sheet}>
        {error && <Text style={styles.error}>{error}</Text>}

        <Button label="Sign In with Email" onPress={() => navigation.navigate("EmailAuth", { mode: "sign-in" })} style={styles.buttonSpacing} />

        {appleAvailable && (
          <Button
            label="Continue with Apple"
            variant="dark"
            icon={<Ionicons name="logo-apple" size={18} color={colors.white} />}
            disabled={busy}
            onPress={() => runAuthAction(signInWithApple)}
            style={styles.buttonSpacing}
          />
        )}

        <Button
          label="Continue with Google"
          variant="outline"
          icon={<Ionicons name="logo-google" size={16} color={colors.textPrimary} />}
          disabled={busy}
          onPress={() => runAuthAction(signInWithGoogle)}
          style={styles.buttonSpacing}
        />

        <TouchableOpacity onPress={() => navigation.navigate("EmailAuth", { mode: "sign-up" })}>
          <Text style={styles.switchModeText}>
            No account? <Text style={styles.switchModeLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { alignItems: "center", justifyContent: "center", paddingTop: 96, paddingBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.lg },
  tagline: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  sheet: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  buttonSpacing: { marginBottom: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: "center" },
  switchModeText: { textAlign: "center", marginTop: spacing.sm, color: colors.textSecondary },
  switchModeLink: { color: colors.forest, fontWeight: "700" },
});
