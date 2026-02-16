import { AppleColors, Fonts, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const failedUploadItemStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: AppleColors.surfaceSecondary,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fileColumn: {
    flex: 1,
    gap: 2,
  },
  filename: {
    flex: 1,
    color: AppleColors.label,
    fontSize: 15,
    fontWeight: "600",
  },
  retryButton: {
    minWidth: 70,
    minHeight: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppleColors.accent,
  },
  retryButtonDisabled: {
    opacity: 0.4,
  },
  retryButtonText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.rounded,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  meta: {
    color: AppleColors.secondaryLabel,
    fontSize: 13,
  },
  errorWrap: {
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    gap: 2,
  },
  errorLabel: {
    color: AppleColors.red,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  error: {
    color: AppleColors.red,
    fontSize: 13,
  },
});
