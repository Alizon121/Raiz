import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "../theme";
import IconBadge from "./IconBadge";

type Props = {
    imageUrl?: string | null;
    organic?: boolean;
};

// Row thumbnail for produce lists, with a leaf badge overlaid when organic.
export default function ProduceThumbnail({ imageUrl, organic }: Props) {
    return (
        <View style={styles.wrap}>
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
                <View style={styles.image}>
                    <IconBadge name="leaf-outline" size={48} />
                </View>
            )}
            {organic && (
                <View style={styles.organicBadge}>
                    <Ionicons name="leaf" size={12} color={colors.white} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginRight: spacing.sm },
    image: { width: 48, height: 48, borderRadius: radii.sm },
    organicBadge: {
        position: "absolute",
        right: -6,
        bottom: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.forest,
        borderWidth: 2,
        borderColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
});
