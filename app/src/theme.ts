// Single source of truth for colors/spacing/type so screens stay visually
// consistent instead of each hand-rolling its own palette.
export const colors = {
  forest: "#1F3A2E",
  forestDark: "#16281F",
  forestMuted: "rgba(255,255,255,0.14)",
  cream: "#F3F1EA",
  white: "#FFFFFF",
  black: "#000000",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "rgba(255,255,255,0.72)",
  textPrimary: "#1F3A2E",
  textSecondary: "#6B7280",
  border: "#E5E1D8",
  danger: "#B00020",
  dotInactive: "rgba(255,255,255,0.35)",
} as const;

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
