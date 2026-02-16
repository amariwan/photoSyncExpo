import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { syncHeroSectionStyles as styles } from './sync-hero-section.styles';
import { formatTimestamp, mediaFilterLabel } from './sync-screen-formatters';

const HERO_COLORS = ['rgba(255,159,10,0.18)', 'rgba(28,28,30,0.95)'] as const;
const HERO_START = { x: 0, y: 0 };
const HERO_END = { x: 1, y: 1 };

type BannerTone = 'info' | 'success' | 'warning';

interface BannerState {
  message: string;
  tone: BannerTone;
}

export function SyncHeroSection() {
  const { permissionState, phase, syncSettings, queue, logs, metadata } = usePhotoSync();

  const stats = useMemo(() => {
    const pending = queue.filter((item) => item.status === 'pending').length;
    const uploading = queue.filter((item) => item.status === 'uploading').length;
    const completed = queue.filter((item) => item.status === 'completed').length;
    const failed = queue.filter((item) => item.status === 'failed').length;
    const total = pending + uploading + completed + failed;

    return {
      pending,
      uploading,
      completed,
      failed,
      total,
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      issues: failed + (permissionState !== 'granted' ? 1 : 0),
    };
  }, [permissionState, queue]);

  const banner = useMemo<BannerState>(() => {
    if (permissionState !== 'granted') {
      return {
        tone: 'warning',
        message: 'Photo permission is required to discover new items.',
      };
    }

    if (stats.failed > 0) {
      return {
        tone: 'warning',
        message: `${stats.failed} failed item(s) require retry.`,
      };
    }

    if (phase === 'scanning') {
      return {
        tone: 'info',
        message: 'Scanning camera roll for new assets…',
      };
    }

    if (phase === 'syncing' || stats.uploading > 0) {
      return {
        tone: 'info',
        message: 'Upload worker is active.',
      };
    }

    if (stats.pending > 0) {
      return {
        tone: 'info',
        message: `${stats.pending} item(s) waiting for upload.`,
      };
    }

    if (stats.total > 0 && stats.completionPercent === 100) {
      return {
        tone: 'success',
        message: 'Queue is fully completed.',
      };
    }

    return {
      tone: 'success',
      message: 'System healthy. Waiting for new media.',
    };
  }, [permissionState, phase, stats.completionPercent, stats.failed, stats.pending, stats.total, stats.uploading]);

  const latestLog = logs[0]?.message;

  return (
    <LinearGradient colors={HERO_COLORS} end={HERO_END} start={HERO_START} style={styles.heroCard}>
      <Text style={styles.brand}>PhotoSync</Text>
      <Text style={styles.title}>{stats.completionPercent}% Synced</Text>
      <Text style={styles.subtitle}>{banner.message}</Text>

      <View style={styles.pills}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Permission</Text>
          <Text style={styles.pillValue}>{permissionState.toUpperCase()}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Phase</Text>
          <Text style={styles.pillValue}>{phase.toUpperCase()}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Issues</Text>
          <Text style={styles.pillValue}>{stats.issues}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Queued</Text>
          <Text style={styles.metricValue}>{stats.pending + stats.uploading}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Completed</Text>
          <Text style={styles.metricValue}>{stats.completed}</Text>
        </View>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Failed</Text>
          <Text style={styles.metricValue}>{stats.failed}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${stats.completionPercent}%` }]} />
      </View>
      <Text style={styles.progressText}>Queue completion: {stats.completionPercent}%</Text>

      <View style={styles.policyRow}>
        <Text style={styles.policyText}>
          Filter: {mediaFilterLabel(syncSettings.uploadPhotos, syncSettings.uploadVideos)}
        </Text>
        <Text style={styles.policyText}>WiFi-only: {syncSettings.wifiOnly ? 'ON' : 'OFF'}</Text>
        <Text style={styles.policyText}>Retry limit: {syncSettings.maxRetryAttempts}</Text>
        <Text style={styles.policyText}>Last sync: {formatTimestamp(metadata.lastCompletedAt)}</Text>
      </View>

      <View
        style={[
          styles.banner,
          banner.tone === 'success' && styles.bannerSuccess,
          banner.tone === 'warning' && styles.bannerWarning,
        ]}>
        <Text style={styles.bannerText}>{banner.message}</Text>
      </View>

      {latestLog ? (
        <View style={styles.latestWrap}>
          <Text numberOfLines={1} style={styles.latestText}>
            Latest: {latestLog}
          </Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}
