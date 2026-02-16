import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const syncSectionStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: AppleColors.surfacePrimary,
    gap: Spacing.md,
  },
  header: {
    gap: 2,
  },
  title: {
    color: AppleColors.label,
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 25,
  },
  caption: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
    lineHeight: 18,
  },
  metadata: {
    color: AppleColors.tertiaryLabel,
    fontSize: 13,
  },
  empty: {
    color: AppleColors.secondaryLabel,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
