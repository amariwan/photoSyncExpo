import { StyleSheet } from "react-native";

import { AppleColors } from "@/constants/theme";

export const syncScreenBackgroundStyles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppleColors.background,
  },
  orbTop: {
    position: "absolute",
    top: -160,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.6,
  },
  orbBottom: {
    position: "absolute",
    bottom: -200,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.4,
  },
});
