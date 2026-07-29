import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TextRecognition from "../../modules/raiz-text-recognition/src";
import Button from "../components/Button";
import { getAllKnownPlus } from "../services/cropLookup";
import type { ScanStackParamList } from "../navigation/types";
import { colors, radii, spacing, typography } from "../theme";
import { extractPluCandidates, resolveBestPluCandidate } from "../utils/plu";

type Props = NativeStackScreenProps<ScanStackParamList, "Scan">;

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const goToManualEntry = () => navigation.navigate("ManualEntry");

  const capture = async () => {
    if (!cameraRef.current || processing) return;
    setError(null);
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (!photo) throw new Error("No photo captured");

      const result = await TextRecognition.recognize(photo.uri);
      const candidates = extractPluCandidates(result.text);
      const knownPlus = await getAllKnownPlus();
      const best = resolveBestPluCandidate(candidates, knownPlus);

      if (best) {
        navigation.navigate("ScanConfirm", { plu: best });
      } else {
        setError("Couldn't find a PLU code in that photo. Try again, or enter it manually.");
      }
    } catch {
      setError("Something went wrong reading that photo. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.forest} style={styles.permissionIcon} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>Raiz uses your camera to read PLU stickers on produce.</Text>
        <Button label="Enable Camera" onPress={requestPermission} style={styles.permissionButton} />
        <TouchableOpacity onPress={goToManualEntry}>
          <Text style={styles.manualLink}>Enter a PLU code manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.frameHint}>
            <Text style={styles.frameHintText}>Frame the PLU sticker</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              testID="shutter-button"
              style={[styles.shutter, processing && styles.shutterDisabled]}
              onPress={capture}
              disabled={processing}
            >
              {processing ? <ActivityIndicator color={colors.white} /> : <View style={styles.shutterInner} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={goToManualEntry}>
              <Text style={styles.manualLinkOnCamera}>Enter manually instead</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: spacing.xl },
  permissionIcon: { marginBottom: spacing.md },
  permissionTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  permissionBody: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.lg },
  permissionButton: { marginBottom: spacing.md },
  manualLink: { color: colors.forest, fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "space-between", padding: spacing.lg },
  frameHint: { alignSelf: "center", marginTop: spacing.xxl, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  frameHintText: { color: colors.white, fontWeight: "600" },
  errorBanner: { backgroundColor: "rgba(176,0,32,0.9)", borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.md },
  errorText: { color: colors.white, textAlign: "center" },
  controls: { alignItems: "center", paddingBottom: spacing.xl },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  shutterDisabled: { opacity: 0.6 },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white },
  manualLinkOnCamera: { color: colors.white, fontWeight: "600", textDecorationLine: "underline" },
});
