import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export default function IconBadge({ name, size = 96 }: { name: keyof typeof Ionicons.glyphMap; size?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name={name} size={size * 0.42} color={colors.textOnDark} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.forestMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});
