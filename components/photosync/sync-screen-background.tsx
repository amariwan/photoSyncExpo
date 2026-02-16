import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View } from 'react-native';

import { syncScreenBackgroundStyles as styles } from './sync-screen-background.styles';

const TOP_ORB_COLORS = ['rgba(255,159,10,0.12)', 'rgba(255,159,10,0.0)'] as const;
const BOTTOM_ORB_COLORS = ['rgba(10,132,255,0.1)', 'rgba(10,132,255,0.0)'] as const;

export function SyncScreenBackground() {
  return (
    <View pointerEvents="none" style={styles.background}>
      <LinearGradient
        colors={TOP_ORB_COLORS}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.orbTop}
      />
      <LinearGradient
        colors={BOTTOM_ORB_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orbBottom}
      />
    </View>
  );
}
