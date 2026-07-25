import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../components/Button";
import DecorativeBackground from "../components/DecorativeBackground";
import IconBadge from "../components/IconBadge";
import { colors, spacing, typography } from "../theme";

const ONBOARDING_SEEN_KEY = "onboarding_seen";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

// Copy deliberately avoids two claims the app doesn't make: it's PLU
// OCR/manual entry, not full visual AI produce recognition, and there is no
// aggregate "score" anywhere in the UI (build spec, non-functional
// requirements) — every figure shown is a sourced, dated data point.
const SLIDES: Slide[] = [
  {
    icon: "leaf-outline",
    title: "Know What's On Your Produce",
    body: "Raiz surfaces the pesticide data USDA and EPA already publish on the fruits and vegetables you buy — sourced, dated, and easy to check yourself.",
  },
  {
    icon: "scan-outline",
    title: "Scan the PLU Sticker",
    body: "Point your camera at the PLU code on any piece of produce, or type it in manually. No barcode needed.",
  },
  {
    icon: "bar-chart-outline",
    title: "Build Your History",
    body: "Every lookup is saved so you can revisit what you've checked and compare over time.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Data, Not Judgment",
    body: "We show typical, statistical data for a crop type — not a lab test of the item in your hand — and never boil it down to a single safety score.",
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    onDone();
  };

  const goTo = (nextIndex: number) => {
    scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    setIndex(nextIndex);
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  return (
    <View style={styles.container}>
      <DecorativeBackground />

      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={finish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.scroll}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <IconBadge name={slide.icon} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button
          label={isLast ? "Let's Get Started" : "Continue"}
          variant="outline"
          onPress={isLast ? finish : () => goTo(index + 1)}
        />
      </View>
    </View>
  );
}

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === "true";
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forest },
  scroll: { flex: 1 },
  skip: { position: "absolute", top: 64, right: spacing.lg, zIndex: 1, backgroundColor: colors.forestMuted, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  skipText: { color: colors.textOnDark, fontWeight: "600" },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  title: { ...typography.h2, color: colors.textOnDark, textAlign: "center", marginTop: spacing.xl, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textOnDarkMuted, textAlign: "center" },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dotInactive, marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: colors.textOnDark },
});
