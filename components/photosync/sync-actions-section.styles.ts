import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const syncActionsSectionStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  phaseBadge: {
    minHeight: 26,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppleColors.surfaceSecondary,
  },
  phaseBadgeActive: {
    backgroundColor: AppleColors.accentSoft,
  },
  phaseBadgeText: {
    color: AppleColors.secondaryLabel,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts.mono,
  },
  phaseBadgeTextActive: {
    color: AppleColors.accent,
  },
  primaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  secondaryRow: {
    flexDirection: "row",
  },
  cleanupRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: AppleColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
    fontFamily: Fonts.rounded,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: AppleColors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: AppleColors.label,
    fontSize: 15,
    fontWeight: "600",
  },
  ghostButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: AppleColors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: AppleColors.secondaryLabel,
    fontSize: 15,
    fontWeight: "600",
  },
  linkButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppleColors.surfaceSecondary,
  },
  linkButtonText: {
    color: AppleColors.blue,
    fontSize: 15,
    fontWeight: "600",
  },
  dangerButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 69, 58, 0.1)",
  },
  dangerButtonText: {
    color: AppleColors.red,
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  activity: {
    marginTop: Spacing.xs,
  },
  warning: {
    color: AppleColors.orange,
    fontSize: 13,
  },
});
