import React from 'react';
import { Text, View } from 'react-native';

import { syncSectionStyles as styles } from './sync-section.styles';

interface SyncSectionHeaderProps {
  title: string;
  caption: string;
}

export function SyncSectionHeader({ title, caption }: SyncSectionHeaderProps) {
  return (
    <View className="mb-2" style={styles.header}>
      <Text className="text-white text-lg font-bold" style={styles.title}>{title}</Text>
      <Text className="text-[rgba(235,235,245,0.45)] text-sm" style={styles.caption}>{caption}</Text>
    </View>
  );
}
