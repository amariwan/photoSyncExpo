import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { syncHeroSectionStyles as styles } from './sync-hero-section.styles';
import { formatTimestamp, mediaFilterLabel } from './sync-screen-formatters';

const HERO_COLORS = ['rgba(46,204,113,0.18)', 'rgba(28,28,30,0.95)'] as const;
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
      <Text className="text-accent uppercase tracking-wider font-semibold text-xs">PhotoSync</Text>
      <Text className="text-white font-extrabold text-3xl leading-10">{stats.completionPercent}% Synced</Text>
      <Text className="text-[rgba(235,235,245,0.6)] text-base leading-5 mb-2">{banner.message}</Text>

      <View className="flex-row gap-2 mt-1">
        <View className="flex-1 rounded-md px-md py-md bg-glass-thin">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Permission</Text>
          <Text className="mt-1 text-white text-sm font-mono font-semibold">{permissionState.toUpperCase()}</Text>
        </View>
        <View className="flex-1 rounded-md px-md py-md bg-glass-thin">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Phase</Text>
          <Text className="mt-1 text-white text-sm font-rounded font-semibold">{phase.toUpperCase()}</Text>
        </View>
        <View className="flex-1 rounded-md px-md py-md bg-glass-thin">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Issues</Text>
          <Text className="mt-1 text-white text-sm font-semibold">{stats.issues}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View className="flex-1 rounded-md px-md py-3 bg-glass-thin items-center">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Queued</Text>
          <Text className="mt-1 text-white text-2xl font-extrabold">{stats.pending + stats.uploading}</Text>
        </View>
        <View className="flex-1 rounded-md px-md py-3 bg-glass-thin items-center">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Completed</Text>
          <Text className="mt-1 text-white text-2xl font-extrabold">{stats.completed}</Text>
        </View>
        <View className="flex-1 rounded-md px-md py-3 bg-glass-thin items-center">
          <Text className="text-[rgba(235,235,245,0.3)] text-[11px] font-semibold uppercase tracking-wider">Failed</Text>
          <Text className="mt-1 text-white text-2xl font-extrabold">{stats.failed}</Text>
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
