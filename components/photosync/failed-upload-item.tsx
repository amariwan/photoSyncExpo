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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.fileColumn}>
          <Text numberOfLines={1} style={styles.filename}>
            {item.filename}
          </Text>
          <Text style={styles.meta}>{new Date(item.creationTime).toLocaleString()}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isRetryDisabled}
          onPress={() => onRetry(item.id)}
          style={[styles.retryButton, isRetryDisabled && styles.retryButtonDisabled]}>
          <Text style={styles.retryButtonText}>Retry</Text>
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
