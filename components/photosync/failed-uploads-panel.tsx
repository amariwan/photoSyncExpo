import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';
import { deriveSyncState, syncStateLabel, type SyncState } from '@/services/photosync/sync-state';

import { FailedUploadItem } from './failed-upload-item';
import { selectRecentFailedUploads } from './failed-uploads-selectors';
import { failedUploadsPanelStyles as styles } from './failed-uploads-panel.styles';

const syncStateStyleByValue: Record<SyncState, keyof typeof styles> = {
  idle: 'syncStateIdle',
  syncing: 'syncStateSyncing',
  partial_failure: 'syncStatePartialFailure',
};

export function FailedUploadsPanel() {
  const { phase, queue, syncSettings, retryFailedUploads, retryUploadItem } = usePhotoSync();
  const failedItems = useMemo(() => selectRecentFailedUploads(queue, 5), [queue]);
  const syncState = useMemo(() => deriveSyncState({ phase, queue }), [phase, queue]);
  const isSyncing = phase === 'syncing';
  const isRetryAllDisabled = isSyncing || failedItems.length === 0;
  const retryExhaustedCount = useMemo(
    () => failedItems.filter((item) => item.attemptCount >= syncSettings.maxRetryAttempts).length,
    [failedItems, syncSettings.maxRetryAttempts]
  );

  return (
    <View style={styles.sectionCard}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Failed Uploads</Text>
          <Text style={styles.subtitle}>
            {failedItems.length} visible failed item(s) • retry exhausted: {retryExhaustedCount}
          </Text>
        </View>
        <Text style={[styles.syncState, styles[syncStateStyleByValue[syncState]]]}>
          {syncStateLabel(syncState)}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isRetryAllDisabled}
        onPress={retryFailedUploads}
        style={[styles.retryAllButton, isRetryAllDisabled && styles.retryAllButtonDisabled]}>
        <Text style={styles.retryAllText}>Retry All Failed</Text>
      </Pressable>

      {failedItems.length === 0 ? (
        <Text style={styles.empty}>No failed uploads. Great job.</Text>
      ) : (
        failedItems.map((item) => (
          <FailedUploadItem
            isSyncing={isSyncing}
            item={item}
            key={item.id}
            maxRetryAttempts={syncSettings.maxRetryAttempts}
            onRetry={retryUploadItem}
          />
        ))
      )}
    </View>
  );
}
