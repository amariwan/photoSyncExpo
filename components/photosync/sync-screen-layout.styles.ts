import { StyleSheet } from "react-native";

import { AppleColors } from "@/constants/theme";

export const syncScreenLayoutStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppleColors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
});
