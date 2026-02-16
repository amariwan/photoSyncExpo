import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import type { SyncLogEntry, SyncLogLevel } from '@/types/photosync';

import { recentActivityItemStyles as styles } from './recent-activity-item.styles';

interface RecentActivityItemProps {
  entry: SyncLogEntry;
}

function dotStyle(level: SyncLogLevel): StyleProp<ViewStyle> {
  switch (level) {
    case 'info':
      return styles.dotInfo;
    case 'error':
      return styles.dotError;
    default:
      return assertNever(level);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled log level: ${String(value)}`);
}

export function RecentActivityItem({ entry }: RecentActivityItemProps) {
  return (
    <View style={styles.item}>
      <View style={[styles.dot, dotStyle(entry.level)]} />
      <View style={styles.content}>
        <Text style={styles.message}>{entry.message}</Text>
        <Text style={styles.time}>{entry.level.toUpperCase()} - {new Date(entry.timestamp).toLocaleTimeString()}</Text>
      </View>
    </View>
  );
}
