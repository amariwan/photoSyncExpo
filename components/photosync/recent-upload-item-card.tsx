import React from 'react';
import { Text, View } from 'react-native';

import type { UploadItem, UploadItemStatus } from '@/types/photosync';

import {
  progressFillWidthStyles,
  recentUploadItemCardStyles as styles,
} from './recent-upload-item-card.styles';
import { formatProgressPercent } from './sync-screen-formatters';

interface RecentUploadItemCardProps {
  item: UploadItem;
  maxRetryAttempts: number;
}

const statusStyleByValue: Record<
  UploadItemStatus,
  'statusPending' | 'statusUploading' | 'statusCompleted' | 'statusFailed'
> = {
  pending: 'statusPending',
  uploading: 'statusUploading',
  completed: 'statusCompleted',
  failed: 'statusFailed',
};

function selectProgressStyle(progress: number) {
  const index = Math.max(0, Math.min(10, Math.round(progress * 10)));
  return progressFillWidthStyles[index];
}

export function RecentUploadItemCard({ item, maxRetryAttempts }: RecentUploadItemCardProps) {
  return (
    <View className="rounded-md p-md bg-glass-thin" style={styles.card}>
      <View className="flex-row justify-between items-center" style={styles.header}>
        <Text numberOfLines={1} className="text-white font-semibold" style={styles.filename}>
          {item.filename}
        </Text>
        <View style={[styles.statusBadge, styles[statusStyleByValue[item.status]]]} className="px-2 py-1 rounded-md">
          <Text className="text-sm font-semibold" style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, selectProgressStyle(item.progress)]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{formatProgressPercent(item.progress)}</Text>
        <Text style={styles.metaText}>{new Date(item.creationTime).toLocaleString()}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Attempts: {item.attemptCount}/{maxRetryAttempts}</Text>
        <Text style={styles.metaText}>Type: {item.mediaType}</Text>
      </View>

      {item.errorMessage ? (
        <View style={styles.errorWrap}>
          <Text style={styles.error}>{item.errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}
