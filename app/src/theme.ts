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
  cream: "#F3F1EA",
  white: "#FFFFFF",
  black: "#000000",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "rgba(255,255,255,0.72)",
  textPrimary: "#2C4A34",
  textSecondary: "#4F6E58",
  border: "#E5E1D8",
  danger: "#B00020",
  dotInactive: "#DEDAD0",
  sageSubtle: "rgba(109, 188, 109, 0.18)",
  sageBold: "rgba(109, 188, 109, 0.55)",
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
