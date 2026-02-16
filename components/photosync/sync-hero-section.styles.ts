import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const syncHeroSectionStyles = StyleSheet.create({
  heroCard: {
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    overflow: "hidden",
    marginTop: 8,
    gap: 6,
  },
  brand: {
    color: AppleColors.accent,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    color: AppleColors.label,
    fontFamily: Fonts.rounded,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  subtitle: {
    color: AppleColors.secondaryLabel,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  pills: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  pill: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppleColors.glassThin,
  },
  pillLabel: {
    color: AppleColors.secondaryLabel,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pillValue: {
    marginTop: 4,
    color: AppleColors.label,
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  metricBlock: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppleColors.glassThin,
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
    lineHeight: 34,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: "hidden",
    backgroundColor: AppleColors.quaternaryFill,
    marginTop: 4,
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
  policyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: 4,
  },
  policyText: {
    color: AppleColors.tertiaryLabel,
    fontSize: 13,
  },
  banner: {
    marginTop: 4,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    backgroundColor: AppleColors.surfaceSecondary,
  },
  bannerSuccess: {
    backgroundColor: "rgba(48, 209, 88, 0.12)",
  },
  bannerWarning: {
    backgroundColor: "rgba(255, 159, 10, 0.12)",
  },
  bannerText: {
    color: AppleColors.label,
    fontSize: 13,
    lineHeight: 18,
  },
  latestWrap: {
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppleColors.surfaceSecondary,
  },
  latestText: {
    color: AppleColors.tertiaryLabel,
    fontSize: 12,
  },
});
