import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Reveal } from '@/components/ui/reveal';
import { Fonts } from '@/constants/theme';
import { usePhotoSync } from '@/providers/photo-sync-provider';

type GalleryFilter = 'all' | 'photo' | 'video';

type MediaType = 'photo' | 'video';

interface RemoteMediaItem {
  id: string;
  name: string;
  path: string;
  mediaType: MediaType;
  size?: number;
  modifiedTime?: number;
}

interface FilterOption {
  label: string;
  value: GalleryFilter;
}

interface QueueItem {
  path: string;
  depth: number;
}

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Photos', value: 'photo' },
  { label: 'Videos', value: 'video' },
];

const PHOTO_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'webp',
  'gif',
  'bmp',
  'tif',
  'tiff',
]);
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'avi', 'mkv', 'webm', '3gp']);
const MAX_DIRECTORY_DEPTH = 4;
const MAX_DIRECTORY_COUNT = 120;

function normalizePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
  if (!normalized) {
    return '/';
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function inferMediaType(filename: string): MediaType | null {
  const extension = filename.toLowerCase().split('.').pop() ?? '';
  if (PHOTO_EXTENSIONS.has(extension)) {
    return 'photo';
  }
  if (VIDEO_EXTENSIONS.has(extension)) {
    return 'video';
  }
  return null;
}

function formatBytes(value?: number): string {
  if (!value || value <= 0) {
    return '--';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatTimestamp(value?: number): string {
  if (!value) {
    return 'Unknown time';
  }

  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativePath(basePath: string, fullPath: string): string {
  const normalizedBase = normalizePath(basePath);
  const normalizedFull = normalizePath(fullPath);
  if (normalizedFull === normalizedBase) {
    return '/';
  }
  if (normalizedFull.startsWith(`${normalizedBase}/`)) {
    return normalizedFull.slice(normalizedBase.length);
  }
  return normalizedFull;
}

export default function GalleryScreen() {
  const {
    smbConfig,
    smbPassword,
    sftpConfig,
    sftpPassword,
    syncSettings,
    listRemoteDirectory,
  } = usePhotoSync();

  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [items, setItems] = useState<RemoteMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transportLabel = syncSettings.transportType === 'sftp' ? 'SFTP / SSH' : 'SMB / NAS';
  const hostLabel = syncSettings.transportType === 'sftp' ? sftpConfig.host : smbConfig.host;
  const rootPath = useMemo(
    () =>
      normalizePath(
        syncSettings.transportType === 'sftp' ? sftpConfig.remotePath || '/' : smbConfig.remotePath || '/'
      ),
    [sftpConfig.remotePath, smbConfig.remotePath, syncSettings.transportType]
  );

  const isConfigured = useMemo(() => {
    if (syncSettings.transportType === 'sftp') {
      return Boolean(sftpConfig.host && sftpConfig.username && sftpPassword);
    }

    return Boolean(smbConfig.host && smbConfig.share && smbConfig.username && smbPassword);
  }, [
    smbConfig.host,
    smbConfig.share,
    smbConfig.username,
    smbPassword,
    sftpConfig.host,
    sftpConfig.username,
    sftpPassword,
    syncSettings.transportType,
  ]);

  const loadServerMedia = useCallback(async () => {
    if (!isConfigured) {
      setItems([]);
      setErrorMessage(`${transportLabel} server is not configured. Complete host, credentials, and path in Settings.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const queue: QueueItem[] = [{ path: rootPath, depth: 0 }];
      const visited = new Set<string>();
      const discovered: RemoteMediaItem[] = [];
      let scannedDirectories = 0;

      while (queue.length > 0 && scannedDirectories < MAX_DIRECTORY_COUNT) {
        const next = queue.shift();
        if (!next) {
          break;
        }

        const normalizedPath = normalizePath(next.path);
        if (visited.has(normalizedPath)) {
          continue;
        }
        visited.add(normalizedPath);
        scannedDirectories += 1;

        const entries = await listRemoteDirectory(normalizedPath);

        for (const entry of entries) {
          if (entry.type === 'directory' && next.depth < MAX_DIRECTORY_DEPTH) {
            queue.push({ path: entry.path, depth: next.depth + 1 });
            continue;
          }

          if (entry.type !== 'file') {
            continue;
          }

          const mediaType = inferMediaType(entry.name);
          if (!mediaType) {
            continue;
          }

          discovered.push({
            id: entry.path,
            name: entry.name,
            path: entry.path,
            mediaType,
            size: entry.size,
            modifiedTime: entry.modifiedTime,
          });
        }
      }

      discovered.sort((a, b) => {
        const timeA = a.modifiedTime ?? 0;
        const timeB = b.modifiedTime ?? 0;
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return a.name.localeCompare(b.name);
      });

      setItems(discovered);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to read server media: ${message}`);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, listRemoteDirectory, rootPath, transportLabel]);

  useEffect(() => {
    void loadServerMedia();
  }, [loadServerMedia]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      return items;
    }

    return items.filter((item) => item.mediaType === filter);
  }, [filter, items]);

  const photoCount = useMemo(() => items.filter((item) => item.mediaType === 'photo').length, [items]);
  const videoCount = useMemo(() => items.filter((item) => item.mediaType === 'video').length, [items]);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <LinearGradient
          colors={['#000000', '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,159,10,0.12)', 'rgba(255,159,10,0.0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.orbTop}
        />
        <LinearGradient
          colors={['rgba(10,132,255,0.08)', 'rgba(10,132,255,0.0)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.orbBottom}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal delay={20}>
          <LinearGradient
            colors={['rgba(255,159,10,0.18)', 'rgba(28,28,30,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.heroLabel}>Server Media</Text>
            <Text style={styles.heroTitle}>Photos & Videos</Text>
            <Text style={styles.heroText}>
              Browse media that already exists on your remote share.
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Transport</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {transportLabel}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Host</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {hostLabel || 'Not set'}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Root</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {rootPath}
                </Text>
              </View>
            </View>
            <Text style={styles.heroStats}>
              {`${items.length} total • ${photoCount} photos • ${videoCount} videos`}
            </Text>
          </LinearGradient>
        </Reveal>

        <Reveal delay={90}>
          <View style={styles.card}>
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map((option) => {
                const isActive = option.value === filter;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => setFilter(option.value)}
                    style={[styles.filterButton, isActive && styles.filterButtonActive]}>
                    <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={() => void loadServerMedia()}
              style={[styles.refreshButton, isLoading && styles.refreshButtonDisabled]}>
              <Text style={styles.refreshButtonText}>{isLoading ? 'Loading...' : 'Refresh from Server'}</Text>
            </Pressable>

            {errorMessage ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isLoading && filteredItems.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#FF9F0A" />
              </View>
            ) : filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>No matching media files on server.</Text>
            ) : (
              <View style={styles.listWrap}>
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <View
                      style={[
                        styles.typeBadge,
                        item.mediaType === 'photo' ? styles.typeBadgePhoto : styles.typeBadgeVideo,
                      ]}>
                      <Text style={styles.typeBadgeText}>{item.mediaType === 'photo' ? 'PHOTO' : 'VIDEO'}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text numberOfLines={1} style={styles.rowTitle}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.rowPath}>
                        {relativePath(rootPath, item.path)}
                      </Text>
                    </View>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowMetaText}>{formatBytes(item.size)}</Text>
                      <Text style={styles.rowMetaText}>{formatTimestamp(item.modifiedTime)}</Text>
                    </View>
                  </View>
                ))}
              </View>
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
    backgroundColor: '#000000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  orbTop: {
    position: 'absolute',
    top: -180,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.55,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -200,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    overflow: 'hidden',
  },
  heroLabel: {
    color: '#FF9F0A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  heroText: {
    marginTop: 8,
    color: 'rgba(235, 235, 245, 0.65)',
    fontSize: 15,
    lineHeight: 20,
  },
  heroMetaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  heroMeta: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(44, 44, 46, 0.55)',
  },
  heroMetaLabel: {
    color: 'rgba(235, 235, 245, 0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroMetaValue: {
    marginTop: 4,
    color: '#FFFFFF',
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: '600',
  },
  heroStats: {
    marginTop: 14,
    color: 'rgba(235, 235, 245, 0.4)',
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#1C1C1E',
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(44, 44, 46, 0.65)',
    borderRadius: 10,
    padding: 3,
  },
  filterButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(120, 120, 128, 0.4)',
  },
  filterButtonText: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  refreshButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9F0A',
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#111113',
    fontSize: 15,
    fontWeight: '700',
  },
  errorCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 69, 58, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 69, 58, 0.55)',
    padding: 12,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 13,
    lineHeight: 18,
  },
  loadingWrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(235, 235, 245, 0.45)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 28,
  },
  listWrap: {
    gap: 8,
  },
  row: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  typeBadge: {
    minWidth: 62,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  typeBadgePhoto: {
    backgroundColor: 'rgba(52, 199, 89, 0.22)',
  },
  typeBadgeVideo: {
    backgroundColor: 'rgba(10, 132, 255, 0.22)',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  rowPath: {
    color: 'rgba(235, 235, 245, 0.45)',
    fontSize: 12,
    fontFamily: Fonts.mono,
  },
  rowMeta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  rowMetaText: {
    color: 'rgba(235, 235, 245, 0.45)',
    fontSize: 11,
  },
});
