import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import AdBanner from "../components/AdBanner";
import EmptyState from "../components/EmptyState";
import IconBadge from "../components/IconBadge";
import ScreenBackground from "../components/ScreenBackground";
import type { FavoritesStackParamList } from "../navigation/types";
import { getFavorites } from "../services/favorites";
import type { FavoriteEntry } from "../types/favorite";
import { colors, radii, spacing, typography } from "../theme";

type Props = NativeStackScreenProps<FavoritesStackParamList, "Favorites">;
type State = "loading" | "none" | FavoriteEntry[];

export default function FavoriteScreen({ navigation }: Props) {
    const { user } = useAuth();
    const [state, setState] = useState<State>("loading");

    // Refetches every time Favorites becomes the focused tab, so a favorite
    // toggled on ProduceDetailScreen shows up without a manual pull-to-refresh.
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            let cancelled = false;
            setState("loading");
            getFavorites(user.uid)
                .then((entries) => !cancelled && setState(entries))
                .catch(() => !cancelled && setState("none"));
            return () => {
                cancelled = true;
            };
        }, [user]),
    );

    return (
        <ScreenBackground style={styles.container}>
            <Text style={styles.title}>Favorites</Text>

            {state === "loading" && (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.forest} />
                </View>
            )}

            {state === "none" && (
                <EmptyState
                    title="No Favorites Yet"
                    body="Make Sure to add a favorite by scanning and favoriting a produce."
                />
            )}

            {Array.isArray(state) && state.length === 0 && (
                <EmptyState body="Star a produce item's detail page to save it here" />
            )}

            {Array.isArray(state) && state.length > 0 && (
                <FlatList
                    data={state}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => navigation.navigate("ProduceDetail", { cropId: item.cropId })}
                        >
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.rowImage} />
                            ) : (
                                <View style={styles.rowImage}>
                                    <IconBadge name="leaf-outline" size={48} />
                                </View>
                            )}
                            <View style={styles.rowTextGroup}>
                                <Text style={styles.rowTitle}>{item.cropName}</Text>
                            </View>
                            <Text style={styles.rowArrow}> {">"} </Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            <AdBanner placement="favorites" />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 32 },
    title: { ...typography.title, color: colors.textOnDark, marginTop: spacing.xl, marginHorizontal: spacing.xl, marginBottom: spacing.md },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.white,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    rowImage: { width: 48, height: 48, borderRadius: radii.sm, marginRight: spacing.sm },
    rowTextGroup: { flex: 1, paddingRight: spacing.sm },
    rowTitle: { ...typography.body, color: colors.forest, fontWeight: "600" },
    rowArrow: { ...typography.body, color: colors.textSecondary, marginLeft: 10 },
});
