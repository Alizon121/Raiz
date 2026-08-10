import { useHeaderHeight } from "@react-navigation/elements";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import TextField from "../components/TextField";
import { deleteAccount } from "../auth/authService";
import { colors, spacing, typography } from "../theme";

const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
  const headerHeight = useHeaderHeight();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      // No navigation needed: deleteAccount() signs out as its last step,
      // which flips useAuth().user to null and RootNavigator swaps to the
      // signed-out stack on its own — same as a normal sign-out.
    } catch {
      setError("Something went wrong deleting your account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: headerHeight + spacing.xl }]}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.body}>
        This permanently deletes your account, your scan history, and any ad-free status tied to it. This cannot be
        undone.
      </Text>

      <Text style={styles.label}>Type {CONFIRM_WORD} to confirm</Text>
      <TextField
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={CONFIRM_WORD}
        editable={!deleting}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Button
        label={deleting ? "Deleting…" : "Delete My Account"}
        onPress={handleDelete}
        disabled={confirmText !== CONFIRM_WORD || deleting}
        loading={deleting}
        style={styles.button}
        textColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.body, fontWeight: "600", color: colors.textPrimary, marginBottom: spacing.sm },
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.md },
  button: { alignSelf: "stretch", backgroundColor: colors.danger, marginTop: spacing.md },
});
