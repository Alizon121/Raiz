import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { backgroundGradient, backgroundGradientLocations } from "../theme";

type Props = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

// Shared forest-to-cream backdrop for screens that used to sit on a flat
// colors.background fill. Children should leave their own container
// transparent so this shows through.
export default function ScreenBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={backgroundGradient}
      locations={backgroundGradientLocations}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
