import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";


export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>About This App</Text>
            <Text style={styles.body}>
                {`This app helps you identify produce items and provides information on reducing pesticide residue. \n\n I personally got tired of not knowing what big Ag was putting on my produce (especially with all the recents approved pesticides that are known to be harmful to humans and the environment).
                \n\nSo I created this app to help people make smarter decisions about the food they eat and live a little healthier because that is just one more step for us getting out the matrix ;)`}.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
    title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
    body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
});