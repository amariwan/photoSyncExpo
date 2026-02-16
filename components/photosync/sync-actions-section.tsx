import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { formatTimestamp } from './sync-screen-formatters';
import { SyncSectionHeader } from './sync-section-header';
import { syncActionsSectionStyles as styles } from './sync-actions-section.styles';
import { syncSectionStyles } from './sync-section.styles';

async function runWithBusyState(action: () => Promise<unknown>, setBusy: (busy: boolean) => void) {
  setBusy(true);
  try {
    await action();
  } finally {
    setBusy(false);
  }
}

export function SyncActionsSection() {
  const [isWorking, setIsWorking] = useState(false);
  const {
    isReady,
    phase,
    metadata,
    cancelAfterCurrentItem,
    requestPhotoPermission,
    scanForNewMedia,
    runSync,
    requestCancelAfterCurrentItem,
    clearCompletedUploads,
    clearAllUploads,
  } = usePhotoSync();

  const isBusy = isWorking || phase !== 'idle';
  const phaseLabel = useMemo(() => phase.toUpperCase(), [phase]);

  return (
    <View style={syncSectionStyles.card}>
      <View style={styles.headerRow}>
        <SyncSectionHeader caption="Manual controls for scan and upload pipeline" title="Actions" />
        <View style={[styles.phaseBadge, phase !== 'idle' && styles.phaseBadgeActive]}>
          <Text style={[styles.phaseBadgeText, phase !== 'idle' && styles.phaseBadgeTextActive]}>
            {phaseLabel}
          </Text>
        </View>
      </View>

      <View style={styles.primaryRow}>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || !isReady}
          onPress={() => runWithBusyState(requestPhotoPermission, setIsWorking)}
          style={[styles.secondaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
          <Text style={styles.secondaryButtonText}>Grant Access</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || !isReady}
          onPress={() => runWithBusyState(scanForNewMedia, setIsWorking)}
          style={[styles.secondaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
          <Text style={styles.secondaryButtonText}>Scan Now</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isBusy || !isReady}
        onPress={() => runWithBusyState(() => runSync({ trigger: 'manual' }), setIsWorking)}
        style={[styles.primaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
        <Text style={styles.primaryButtonText}>Start Upload Run</Text>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable
          accessibilityRole="button"
          disabled={phase !== 'syncing'}
          onPress={requestCancelAfterCurrentItem}
          style={[styles.ghostButton, phase !== 'syncing' && styles.buttonDisabled]}>
          <Text style={styles.ghostButtonText}>Stop After Current Item</Text>
        </Pressable>
      </View>

      <View style={styles.cleanupRow}>
        <Pressable accessibilityRole="button" onPress={clearCompletedUploads} style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Clear Completed</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={clearAllUploads} style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Clear All</Text>
        </Pressable>
      </View>

      {isBusy ? <ActivityIndicator color="#ffb45b" style={styles.activity} /> : null}
      {cancelAfterCurrentItem ? (
        <Text accessibilityRole="alert" style={styles.warning}>
          Stop requested after current item.
        </Text>
      ) : null}
      <Text style={syncSectionStyles.metadata}>Last sync: {formatTimestamp(metadata.lastCompletedAt)}</Text>
    </View>
  );
}
