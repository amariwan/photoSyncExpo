import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  type DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Reveal } from '@/components/ui/reveal';
import { Fonts } from '@/constants/theme';
import { usePhotoSync } from '@/providers/photo-sync-provider';

function formatTimestamp(value: number | null): string {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function toProgressWidth(value: number): DimensionValue {
  return `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;
}

function mediaFilterLabel(uploadPhotos: boolean, uploadVideos: boolean): string {
  if (uploadPhotos && uploadVideos) {
    return 'Photos + Videos';
  }
  if (uploadPhotos) {
    return 'Photos only';
  }
  if (uploadVideos) {
    return 'Videos only';
  }

  return 'Disabled';
}

function queueTone(status: string): string {
  switch (status) {
    case 'completed':
      return '#4bc08f';
    case 'failed':
      return '#f77979';
    case 'uploading':
      return '#ffce6f';
    default:
      return '#a1b5cc';
  }
}

function logTone(level: string): string {
  switch (level) {
    case 'error':
      return '#f77979';
    case 'warn':
      return '#ffc36b';
    default:
      return '#75b2ff';
  }
}

export default function SyncScreen() {
  const {
    isReady,
    phase,
    permissionState,
    metadata,
    queue,
    logs,
    syncSettings,
    cancelAfterCurrentItem,
    requestPhotoPermission,
    scanForNewMedia,
    runSync,
    requestCancelAfterCurrentItem,
    retryFailedUploads,
    clearCompletedUploads,
    clearFailedUploads,
    clearAllUploads,
  } = usePhotoSync();

  const [isWorking, setIsWorking] = useState(false);

  const stats = useMemo(() => {
    const pending = queue.filter((item) => item.status === 'pending').length;
    const uploading = queue.filter((item) => item.status === 'uploading').length;
    const completed = queue.filter((item) => item.status === 'completed').length;
    const failed = queue.filter((item) => item.status === 'failed').length;
    const retryExhausted = queue.filter(
      (item) => item.status === 'failed' && item.attemptCount >= syncSettings.maxRetryAttempts
    ).length;

    return {
      pending,
      uploading,
      completed,
      failed,
      retryExhausted,
    };
  }, [queue, syncSettings.maxRetryAttempts]);

  const visibleQueue = useMemo(
    () => [...queue].sort((a, b) => b.creationTime - a.creationTime).slice(0, 14),
    [queue]
  );

  const isBusy = isWorking || phase !== 'idle';

  const handlePermission = async () => {
    setIsWorking(true);
    try {
      await requestPhotoPermission();
    } finally {
      setIsWorking(false);
    }
  };

  const handleScan = async () => {
    setIsWorking(true);
    try {
      await scanForNewMedia();
    } finally {
      setIsWorking(false);
    }
  };

  const handleSync = async () => {
    setIsWorking(true);
    try {
      await runSync({ trigger: 'manual' });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <LinearGradient
          colors={['#04111e', '#0a2337', '#0c1b2b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,138,0,0.2)', 'rgba(255,138,0,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbTop}
        />
        <LinearGradient
          colors={['rgba(46,130,255,0.18)', 'rgba(46,130,255,0.01)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.orbBottom}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal delay={20}>
          <LinearGradient
            colors={['rgba(255,138,0,0.24)', 'rgba(26,56,88,0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.brand}>PhotoSync</Text>
            <Text style={styles.heroTitle}>Modern Sync Control</Text>
            <Text style={styles.heroSubtitle}>
              Automatic Camera Roll detection with queue-first SMB uploads, progress visibility, and retry policy.
            </Text>
            <View style={styles.heroPills}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>Permission</Text>
                <Text style={styles.heroPillValue}>{permissionState.toUpperCase()}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>Phase</Text>
                <Text style={styles.heroPillValue}>{phase.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.policyRow}>
              <Text style={styles.policyText}>
                Filter: {mediaFilterLabel(syncSettings.uploadPhotos, syncSettings.uploadVideos)}
              </Text>
              <Text style={styles.policyText}>WiFi-only: {syncSettings.wifiOnly ? 'ON' : 'OFF'}</Text>
              <Text style={styles.policyText}>Retry limit: {syncSettings.maxRetryAttempts}</Text>
            </View>
          </LinearGradient>
        </Reveal>

        <Reveal delay={80}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <Text style={styles.sectionCaption}>Manual control for scan and upload pipeline</Text>
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                accessibilityRole="button"
                onPress={handlePermission}
                disabled={isBusy || !isReady}
                style={[styles.primaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>Grant Access</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleScan}
                disabled={isBusy || !isReady}
                style={[styles.primaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>Scan</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleSync}
                disabled={isBusy || !isReady}
                style={[styles.primaryButton, (isBusy || !isReady) && styles.buttonDisabled]}>
                <Text style={styles.primaryButtonText}>Upload</Text>
              </Pressable>
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                accessibilityRole="button"
                onPress={retryFailedUploads}
                disabled={isBusy || !isReady}
                style={[styles.ghostButton, (isBusy || !isReady) && styles.buttonDisabled]}>
                <Text style={styles.ghostButtonText}>Retry Failed</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={clearFailedUploads}
                disabled={isBusy || !isReady}
                style={[styles.ghostButton, (isBusy || !isReady) && styles.buttonDisabled]}>
                <Text style={styles.ghostButtonText}>Clear Failed</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={requestCancelAfterCurrentItem}
                disabled={phase !== 'syncing'}
                style={[styles.ghostButton, phase !== 'syncing' && styles.buttonDisabled]}>
                <Text style={styles.ghostButtonText}>Stop After Item</Text>
              </Pressable>
            </View>

            <View style={styles.actionGrid}>
              <Pressable accessibilityRole="button" onPress={clearCompletedUploads} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Clear Completed</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={clearAllUploads} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Clear All</Text>
              </Pressable>
            </View>

            {isBusy ? <ActivityIndicator color="#ffac47" style={styles.activity} /> : null}
            {cancelAfterCurrentItem ? (
              <Text accessibilityRole="alert" style={styles.warningText}>
                Stop requested after current item.
              </Text>
            ) : null}
            <Text style={styles.metadataText}>Last sync: {formatTimestamp(metadata.lastCompletedAt)}</Text>
          </View>
        </Reveal>

        <Reveal delay={140}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Queue Summary</Text>
              <Text style={styles.sectionCaption}>Current status across all tracked media</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pending</Text>
                <Text style={styles.metricValue}>{stats.pending}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Uploading</Text>
                <Text style={styles.metricValue}>{stats.uploading}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Completed</Text>
                <Text style={styles.metricValue}>{stats.completed}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Failed</Text>
                <Text style={styles.metricValue}>{stats.failed}</Text>
              </View>
            </View>
            <Text style={styles.metadataText}>Retry exhausted: {stats.retryExhausted}</Text>
          </View>
        </Reveal>

        <Reveal delay={200}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Upload Items</Text>
              <Text style={styles.sectionCaption}>Newest first, limited preview</Text>
            </View>
            {visibleQueue.length === 0 ? (
              <Text style={styles.emptyText}>No items queued yet.</Text>
            ) : (
              visibleQueue.map((item) => (
                <View key={item.id} style={styles.queueItem}>
                  <View style={styles.queueHeader}>
                    <Text style={styles.queueFileName} numberOfLines={1}>
                      {item.filename}
                    </Text>
                    <Text style={[styles.queueStatus, { color: queueTone(item.status) }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: toProgressWidth(item.progress) }]} />
                  </View>
                  <View style={styles.queueMetaRow}>
                    <Text style={styles.queueMetaText}>{toPercent(item.progress)}</Text>
                    <Text style={styles.queueMetaText}>{new Date(item.creationTime).toLocaleString()}</Text>
                  </View>
                  <View style={styles.queueMetaRow}>
                    <Text style={styles.queueMetaText}>
                      Attempts: {item.attemptCount}/{syncSettings.maxRetryAttempts}
                    </Text>
                    <Text style={styles.queueMetaText}>Type: {item.mediaType}</Text>
                  </View>
                  {item.errorMessage ? <Text style={styles.errorText}>{item.errorMessage}</Text> : null}
                </View>
              ))
            )}
          </View>
        </Reveal>

        <Reveal delay={260}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Text style={styles.sectionCaption}>Operational events and errors</Text>
            </View>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No activity yet.</Text>
            ) : (
              logs.slice(0, 12).map((entry) => (
                <View key={entry.id} style={styles.logItem}>
                  <View style={[styles.logDot, { backgroundColor: logTone(entry.level) }]} />
                  <View style={styles.logContent}>
                    <Text style={styles.logMessage}>{entry.message}</Text>
                    <Text style={styles.logTime}>
                      {entry.level.toUpperCase()} · {new Date(entry.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#04111e',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  orbTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 280,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -150,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 26,
    gap: 12,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  brand: {
    color: '#ffd290',
    fontFamily: Fonts.rounded,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: '#f8fbff',
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 10,
    color: '#dce8f5',
    fontSize: 14,
    lineHeight: 20,
  },
  heroPills: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  heroPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(13, 24, 35, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroPillLabel: {
    color: '#98b3cc',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroPillValue: {
    marginTop: 3,
    color: '#f4f9ff',
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  policyRow: {
    marginTop: 12,
    gap: 4,
  },
  policyText: {
    color: '#c8dbef',
    fontSize: 12,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(6, 23, 37, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(153, 184, 214, 0.2)',
    gap: 12,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#f4f8fd',
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  sectionCaption: {
    color: '#9ab4ca',
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    minWidth: 90,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#ff9b2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#092034',
    fontSize: 13,
    fontWeight: '700',
  },
  ghostButton: {
    flex: 1,
    minWidth: 90,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(24, 51, 75, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(154, 190, 220, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: '#d4e5f6',
    fontSize: 12,
    fontWeight: '700',
  },
  linkButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(152, 182, 209, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: '#abcae5',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  activity: {
    marginTop: 4,
  },
  warningText: {
    color: '#ffc680',
    fontSize: 12,
  },
  metadataText: {
    color: '#9bb4c8',
    fontSize: 12,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(160, 192, 219, 0.22)',
    backgroundColor: 'rgba(24, 47, 68, 0.7)',
  },
  metricLabel: {
    color: '#9fb9d2',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    marginTop: 4,
    color: '#f5f9fd',
    fontFamily: Fonts.rounded,
    fontSize: 24,
  },
  queueItem: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(20, 40, 58, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(156, 188, 214, 0.22)',
    gap: 8,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  queueFileName: {
    flex: 1,
    color: '#e5eff9',
    fontSize: 13,
    fontWeight: '600',
  },
  queueStatus: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1a3d58',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ff9b2a',
  },
  queueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  queueMetaText: {
    color: '#a7bfd3',
    fontSize: 11,
  },
  errorText: {
    color: '#ff9f9f',
    fontSize: 12,
  },
  logItem: {
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(154, 188, 214, 0.22)',
    backgroundColor: 'rgba(18, 39, 57, 0.72)',
    flexDirection: 'row',
    gap: 10,
  },
  logDot: {
    marginTop: 4,
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  logContent: {
    flex: 1,
    gap: 2,
  },
  logMessage: {
    color: '#e5f0fa',
    fontSize: 13,
  },
  logTime: {
    color: '#97afc2',
    fontSize: 11,
  },
  emptyText: {
    color: '#9cb5c8',
    fontSize: 13,
  },
});
