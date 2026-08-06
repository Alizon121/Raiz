import type { ComponentProps } from "react";
import { StyleSheet, TextInput } from "react-native";
import { colors, radii, spacing } from "../theme";

type TextFieldProps = ComponentProps<typeof TextInput>;

/** Shared text input chrome (border/radius/padding/colors) so every form field in the app looks identical. */
export default function TextField({ style, ...props }: TextFieldProps) {
  return <TextInput placeholderTextColor={colors.textSecondary} style={[styles.input, style]} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});
