import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

interface IconBadgeProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

export default function IconBadge({
  name,
  size = 96,
  backgroundColor = colors.forestMuted,
  iconColor = colors.textOnDark,
}: IconBadgeProps) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Ionicons name={name} size={size * 0.42} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
