import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type ViewStyle } from "react-native";
import GoogleLogo from "../icons/GoogleLogo";

/**
 * "Continue with Google" button built to Google's brand guidelines
 * (https://developers.google.com/identity/branding-guidelines) rather than
 * our own Button component: Google's colors/logo/padding are fixed
 * regardless of the app's own theme, so this intentionally does NOT pull
 * from src/theme.ts. Light theme only, since that's what the rest of the
 * auth screen uses. Text copy, sizing (18px logo, 14/20 type), and padding
 * (16px edges, 12px after the logo) all match the guideline's iOS spec.
 */
export default function GoogleSignInButton({
  onPress,
  disabled,
  loading,
  style,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Layout-only overrides (e.g. margin) — brand-mandated colors/padding/border are fixed and not overridable. */
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#1F1F1F" />
      ) : (
        <>
          <GoogleLogo size={18} />
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#747775",
    borderRadius: 4, // Google's documented default for the rectangular button shape
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 11, // yields ~44pt tap target at 14/20 type, matching our other auth buttons
  },
  disabled: { opacity: 0.5 },
  label: { marginLeft: 12, color: "#1F1F1F", fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
