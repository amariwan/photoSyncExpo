import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const queueSummarySectionStyles = StyleSheet.create({
  topStrip: {
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppleColors.surfaceSecondary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topStripTitle: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
    fontWeight: "600",
  },
  topStripValue: {
    color: AppleColors.label,
    fontFamily: Fonts.rounded,
    fontSize: 15,
    fontWeight: "600",
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricCard: {
    width: "48%",
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppleColors.surfaceSecondary,
    alignItems: "center",
  },
  metricLabel: {
    color: AppleColors.secondaryLabel,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricValue: {
    marginTop: 4,
    color: AppleColors.label,
    fontFamily: Fonts.rounded,
    fontSize: 28,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: "hidden",
    backgroundColor: AppleColors.quaternaryFill,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: AppleColors.accent,
  },
  progressText: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
    marginTop: 2,
  },
});
