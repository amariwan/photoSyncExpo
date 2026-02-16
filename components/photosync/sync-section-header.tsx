import React from 'react';
import { Text, View } from 'react-native';

import { syncSectionStyles as styles } from './sync-section.styles';

interface SyncSectionHeaderProps {
  title: string;
  caption: string;
}

export function SyncSectionHeader({ title, caption }: SyncSectionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}
