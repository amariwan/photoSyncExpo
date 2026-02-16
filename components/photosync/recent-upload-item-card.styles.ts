import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const recentUploadItemCardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: AppleColors.surfaceSecondary,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  filename: {
    flex: 1,
    color: AppleColors.label,
    fontSize: 15,
    fontWeight: "600",
  },
  statusBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Fonts.mono,
    letterSpacing: 0.2,
  },
  statusPending: {
    backgroundColor: AppleColors.quaternaryFill,
  },
  statusUploading: {
    backgroundColor: AppleColors.accentSoft,
  },
  statusCompleted: {
    backgroundColor: "rgba(48, 209, 88, 0.15)",
  },
  statusFailed: {
    backgroundColor: "rgba(255, 69, 58, 0.15)",
  },
  progressTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: AppleColors.quaternaryFill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: AppleColors.accent,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  metaText: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
  },
  errorWrap: {
    borderRadius: Radius.sm,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  error: {
    color: AppleColors.red,
    fontSize: 13,
  },
});

const progressWidthStyles = StyleSheet.create({
  progress0: { width: "0%" },
  progress1: { width: "10%" },
  progress2: { width: "20%" },
  progress3: { width: "30%" },
  progress4: { width: "40%" },
  progress5: { width: "50%" },
  progress6: { width: "60%" },
  progress7: { width: "70%" },
  progress8: { width: "80%" },
  progress9: { width: "90%" },
  progress10: { width: "100%" },
});

export const progressFillWidthStyles = [
  progressWidthStyles.progress0,
  progressWidthStyles.progress1,
  progressWidthStyles.progress2,
  progressWidthStyles.progress3,
  progressWidthStyles.progress4,
  progressWidthStyles.progress5,
  progressWidthStyles.progress6,
  progressWidthStyles.progress7,
  progressWidthStyles.progress8,
  progressWidthStyles.progress9,
  progressWidthStyles.progress10,
] as const;
