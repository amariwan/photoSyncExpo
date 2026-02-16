/**
 * Apple Photos–inspired design system.
 * Uses iOS system colors, SF-style typography, and clean dark-mode surfaces.
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#000000",
    background: "#FFFFFF",
    tint: "#007AFF",
    icon: "#8E8E93",
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#007AFF",
  },
  dark: {
    text: "#FFFFFF",
    background: "#000000",
    tint: "#0A84FF",
    icon: "#8E8E93",
    tabIconDefault: "#636366",
    tabIconSelected: "#0A84FF",
  },
};

/** iOS system color tokens (dark mode) */
export const AppleColors = {
  // Backgrounds
  background: "#000000",
  surfacePrimary: "#1C1C1E",
  surfaceSecondary: "#2C2C2E",
  surfaceTertiary: "#3A3A3C",
  surfaceElevated: "#1C1C1E",

  // Labels
  label: "#FFFFFF",
  secondaryLabel: "rgba(235, 235, 245, 0.6)",
  tertiaryLabel: "rgba(235, 235, 245, 0.3)",
  quaternaryLabel: "rgba(235, 235, 245, 0.18)",

  // Fills
  fill: "rgba(120, 120, 128, 0.36)",
  secondaryFill: "rgba(120, 120, 128, 0.32)",
  tertiaryFill: "rgba(118, 118, 128, 0.24)",
  quaternaryFill: "rgba(116, 116, 128, 0.18)",

  // System accents
  blue: "#0A84FF",
  green: "#30D158",
  orange: "#2ECC71",
  red: "#FF453A",
  yellow: "#FFD60A",
  purple: "#BF5AF2",
  teal: "#64D2FF",

  // Brand
  accent: "#2ECC71",
  accentSoft: "rgba(46, 204, 113, 0.16)",

  // Separators
  separator: "rgba(84, 84, 88, 0.65)",
  opaqueSeparator: "#38383A",

  // Glass surfaces
  glass: "rgba(30, 30, 30, 0.72)",
  glassThick: "rgba(30, 30, 30, 0.88)",
  glassThin: "rgba(44, 44, 46, 0.55)",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
