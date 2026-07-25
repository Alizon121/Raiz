import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "../theme";

type Variant = "primary" | "dark" | "outline";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textColor?: string;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: { container: { backgroundColor: colors.forest }, text: { color: colors.white } },
  dark: { container: { backgroundColor: colors.black }, text: { color: colors.white } },
  outline: { container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, text: { color: colors.textPrimary } },
};

export default function Button({ label, onPress, variant = "primary", icon, disabled, loading, style, textColor }: ButtonProps) {
  const v = variantStyles[variant];
  const resolvedTextColor = textColor ?? v.text.color;
  return (
    <TouchableOpacity
      style={[styles.base, v.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={resolvedTextColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: resolvedTextColor }, icon ? { marginLeft: spacing.sm } : null]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
  },
  disabled: { opacity: 0.5 },
  label: { ...typography.button },
});
