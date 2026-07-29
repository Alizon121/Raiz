// Single source of truth for colors/spacing/type so screens stay visually
// consistent instead of each hand-rolling its own palette.
//

export const colors = {
  forest: "#357A42",
  forestDark: "#1F4A29",
  // This one *is* literally rgba(109, 188, 109, 0.37) — it's used as a soft
  // translucent badge backdrop (see IconBadge), exactly the role that color
  // was made for.
  forestMuted: "rgba(109, 188, 109, 0.37)",
  // Very light, cool, barely-tinted sage-white rather than a warm cream —
  // reads as clean/professional while still tying back to the green brand,
  // instead of either a stark clinical white or a warmer "farmers-market"
  // cream. Every screen background pulls from this one token.
  background: "#F6F8F5",
  white: "#FFFFFF",
  black: "#000000",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "rgba(255,255,255,0.72)",
  textPrimary: "#2C4A34",
  textSecondary: "#4F6E58",
  border: "#DEE3DC",
  danger: "#B00020",
  dotInactive: "#D7DED6",
  sageSubtle: "rgba(109, 188, 109, 0.18)",
  sageBold: "rgba(109, 188, 109, 0.55)",
  // Amber, not red: for "closest to its legal tolerance, worth a look" —
  // deliberately distinct from `danger`, since these findings are still
  // under the legal limit and this isn't meant to read as an error/alarm.
  caution: "#8A5A00",
  cautionBg: "rgba(230, 162, 60, 0.22)",
} as const;

// Soft per-slide badge tints for the onboarding carousel — desaturated
// enough to read as neutral background, not a saturated color chip.
export const pastels = ["#E7EFE9", "#F5E9E8", "#F0EAE0", "#F4E7DE"] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 32, fontWeight: "700" as const },
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  button: { fontSize: 16, fontWeight: "600" as const },
};
