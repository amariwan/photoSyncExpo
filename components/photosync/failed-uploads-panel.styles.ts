import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const failedUploadsPanelStyles = StyleSheet.create({
  sectionCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: AppleColors.surfacePrimary,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: AppleColors.label,
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
  },
  syncState: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  syncStateIdle: {
    color: AppleColors.secondaryLabel,
  },
  syncStateSyncing: {
    color: AppleColors.orange,
  },
  syncStatePartialFailure: {
    color: AppleColors.red,
  },
  retryAllButton: {
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppleColors.surfaceSecondary,
  },
  retryAllButtonDisabled: {
    opacity: 0.4,
  },
  retryAllText: {
    color: AppleColors.blue,
    fontSize: 15,
    fontWeight: "600",
  },
  empty: {
    color: AppleColors.secondaryLabel,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
});
