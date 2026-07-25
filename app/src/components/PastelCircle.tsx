import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/** Plain circular backdrop for the onboarding illustrations (distinct from
 * IconBadge, which is specifically an Ionicons-in-a-circle badge). */
export default function PastelCircle({
  size = 220,
  backgroundColor,
  children,
}: {
  size?: number;
  backgroundColor: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
});
