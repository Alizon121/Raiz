import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { signOut } from "../auth/authService";
import { useAuth } from "../auth/AuthContext";
import { resetOnboarding } from "./OnboardingScreen";
import { colors, spacing, typography } from "../theme";

export default function SettingsScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {user?.email && <Text style={styles.email}>{user.email}</Text>}
      <Button
        label="Sign out"
        variant="outline"
        onPress={() => signOut()}
        style={styles.signOutButton}
        textColor={colors.danger}
      />

      {/* Dev-only: replays onboarding on next sign-out without uninstalling the app. Not shipped in prod builds. */}
      {__DEV__ && (
        <Button
          label="Replay onboarding (dev only)"
          variant="outline"
          onPress={async () => {
            await resetOnboarding();
            await signOut();
          }}
          style={styles.devButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.cream },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  email: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  signOutButton: { borderColor: colors.danger },
  devButton: { marginTop: spacing.md },
});
