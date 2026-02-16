import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { queueSummarySectionStyles as styles } from './queue-summary-section.styles';
import { computeQueueStats } from './sync-screen-selectors';
import { SyncSectionHeader } from './sync-section-header';
import { syncSectionStyles } from './sync-section.styles';

export function QueueSummarySection() {
  const { queue, syncSettings } = usePhotoSync();
  const stats = useMemo(
    () => computeQueueStats(queue, syncSettings.maxRetryAttempts),
    [queue, syncSettings.maxRetryAttempts]
  );

  const totalTracked = stats.pending + stats.uploading + stats.completed + stats.failed;
  const completionPercent = totalTracked > 0 ? Math.round((stats.completed / totalTracked) * 100) : 0;
  const healthLabel =
    stats.failed > 0 ? 'Needs Attention' : stats.uploading > 0 ? 'In Progress' : 'Healthy';

  return (
    <View style={syncSectionStyles.card}>
      <SyncSectionHeader caption="Current status across all tracked media" title="Queue Summary" />

      <View style={styles.topStrip}>
        <Text style={styles.topStripTitle}>Queue Health</Text>
        <Text style={styles.topStripValue}>{healthLabel}</Text>
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

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
      </View>
      <Text style={styles.progressText}>Completion: {completionPercent}% across {totalTracked} item(s)</Text>

      <Text style={syncSectionStyles.metadata}>Retry exhausted: {stats.retryExhausted}</Text>
    </View>
  );
}
