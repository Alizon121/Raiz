import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

/** The soft translucent-circle backdrop used on dark-green hero sections. */
export default function DecorativeBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.circle, styles.topRight]} />
      <View style={[styles.circle, styles.bottomLeft]} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: colors.forestMuted,
  },
  topRight: { width: 220, height: 220, top: -60, right: -60 },
  bottomLeft: { width: 260, height: 260, bottom: -80, left: -100 },
});
