import { AppleColors, Radius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const recentActivityItemStyles = StyleSheet.create({
  item: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: AppleColors.surfaceSecondary,
    flexDirection: "row",
    gap: Spacing.md,
  },
  dot: {
    marginTop: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInfo: {
    backgroundColor: AppleColors.blue,
  },
  dotError: {
    backgroundColor: AppleColors.red,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  message: {
    color: AppleColors.label,
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    color: AppleColors.tertiaryLabel,
    fontSize: 13,
  },
});
