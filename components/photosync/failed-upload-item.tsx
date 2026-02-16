import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { UploadItem } from '@/types/photosync';

import { failedUploadItemStyles as styles } from './failed-upload-item.styles';

interface FailedUploadItemProps {
  item: UploadItem;
  isSyncing: boolean;
  maxRetryAttempts: number;
  onRetry: (itemId: string) => void;
}

export function FailedUploadItem({
  item,
  isSyncing,
  maxRetryAttempts,
  onRetry,
}: FailedUploadItemProps) {
  const isRetryLimitReached = item.attemptCount >= maxRetryAttempts;
  const isRetryDisabled = isSyncing || isRetryLimitReached;

  const attemptsLabel = isRetryLimitReached
    ? `Retry limit reached (${item.attemptCount}/${maxRetryAttempts})`
    : `Attempts: ${item.attemptCount}/${maxRetryAttempts}`;

  return (
    <View className="rounded-lg p-md bg-glass-thin" style={styles.card}>
      <View style={styles.header}>
        <View className="flex-1" style={styles.fileColumn}>
          <Text numberOfLines={1} className="text-white font-semibold" style={styles.filename}>
            {item.filename}
          </Text>
          <Text className="text-[rgba(235,235,245,0.45)] text-sm" style={styles.meta}>{new Date(item.creationTime).toLocaleString()}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isRetryDisabled}
          onPress={() => onRetry(item.id)}
          className="rounded-md px-3 py-2 bg-accent"
          style={[styles.retryButton, isRetryDisabled && styles.retryButtonDisabled]}>
          <Text className="text-black font-semibold" style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.meta}>{attemptsLabel}</Text>
        <Text style={styles.meta}>Type: {item.mediaType}</Text>
      </View>

      <View style={styles.errorWrap}>
        <Text style={styles.errorLabel}>Error</Text>
        <Text style={styles.error}>{item.errorMessage ?? 'Unknown upload error.'}</Text>
      </View>
    </View>
  );
}
