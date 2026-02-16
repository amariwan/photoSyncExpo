import { FileBrowser } from '@/components/photosync/file-browser';
import { AppleColors, Spacing } from '@/constants/theme';
import { usePhotoSync } from '@/providers/photo-sync-provider';
import type { RemoteFileEntry } from '@/types/photosync';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function normalizePath(path: string): string {
  const normalized = path.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
  if (!normalized) {
    return '/';
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export default function FileManagerScreen() {
  const {
    smbConfig,
    smbPassword,
    sftpConfig,
    sftpPassword,
    syncSettings,
    listRemoteDirectory,
    saveConnectionSettings,
  } = usePhotoSync();

  const activeRootPath = useMemo(
    () =>
      normalizePath(
        syncSettings.transportType === 'sftp' ? sftpConfig.remotePath || '/' : smbConfig.remotePath || '/'
      ),
    [sftpConfig.remotePath, smbConfig.remotePath, syncSettings.transportType]
  );
  const [currentPath, setCurrentPath] = useState(activeRootPath);
  const [files, setFiles] = useState<RemoteFileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPath(activeRootPath);
  }, [activeRootPath]);

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

  const transportLabel = syncSettings.transportType === 'sftp' ? 'SFTP / SSH' : 'SMB / NAS';
  const hostLabel = syncSettings.transportType === 'sftp' ? sftpConfig.host : smbConfig.host;

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async (path: string) => {
      if (!isConfigured) {
        setFiles([]);
        setError(`${transportLabel} server is not configured. Open Settings and fill host/user credentials.`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const entries = await listRemoteDirectory(path);
        if (!cancelled) {
          setFiles(entries);
        }
      } catch (loadError) {
        if (!cancelled) {
          const errorMessage =
            loadError instanceof Error ? loadError.message : 'Failed to load directory';
          setError(errorMessage);
          setFiles([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDirectory(currentPath);

    return () => {
      cancelled = true;
    };
  }, [currentPath, isConfigured, listRemoteDirectory, transportLabel]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleSelectPath = (path: string) => {
    setSelectedPath(path);
    Alert.alert('Path Selected', `You selected: ${path}`, [
      { text: 'Cancel', onPress: () => setSelectedPath(null), style: 'cancel' },
      { text: 'Use This Path', onPress: () => void confirmSelection(path) },
    ]);
  };

  const confirmSelection = async (path: string) => {
    try {
      if (syncSettings.transportType === 'sftp') {
        await saveConnectionSettings(
          'sftp',
          {
            ...sftpConfig,
            remotePath: path,
          },
          sftpPassword
        );
      } else {
        await saveConnectionSettings(
          'smb',
          {
            ...smbConfig,
            remotePath: path,
          },
          smbPassword
        );
      }

      Alert.alert('Success', `Upload destination set to: ${path}`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : String(saveError);
      Alert.alert('Save failed', message);
    } finally {
      setSelectedPath(null);
    }
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: AppleColors.background }}>
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderBottomColor: AppleColors.separator,
          borderBottomWidth: 1,
          backgroundColor: AppleColors.surfacePrimary,
        }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: AppleColors.label,
          }}>
          File Manager
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: AppleColors.secondaryLabel,
            marginTop: Spacing.xs,
          }}>
          {`Remote browser (${transportLabel})`}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: AppleColors.tertiaryLabel,
            marginTop: Spacing.xs,
          }}
          numberOfLines={1}>
          {hostLabel ? `Host: ${hostLabel}` : 'Host not configured'}
        </Text>
      </View>

      {error ? (
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            backgroundColor: `${AppleColors.red}33`,
            borderBottomColor: AppleColors.red,
            borderBottomWidth: 1,
          }}>
          <Text
            style={{
              fontSize: 14,
              color: AppleColors.red,
              lineHeight: 20,
            }}>
            {error}
          </Text>
        </View>
      ) : (
        <FileBrowser
          currentPath={currentPath}
          files={files}
          isLoading={isLoading}
          onNavigate={handleNavigate}
          onSelectPath={handleSelectPath}
          canSelectDirectories
        />
      )}

      {selectedPath && (
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            backgroundColor: AppleColors.surfacePrimary,
            borderTopColor: AppleColors.separator,
            borderTopWidth: 1,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: AppleColors.tertiaryLabel,
              marginBottom: Spacing.sm,
            }}>
            SELECTED PATH
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: AppleColors.label,
              fontWeight: '600',
              fontFamily: 'Courier',
            }}
            numberOfLines={1}>
            {selectedPath}
          </Text>
        </View>
      )}

      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          backgroundColor: AppleColors.surfacePrimary,
          borderTopColor: AppleColors.separator,
          borderTopWidth: 1,
        }}>
        <Text
          style={{
            fontSize: 12,
            color: AppleColors.secondaryLabel,
            lineHeight: 18,
          }}>
          Select a remote directory to store uploads. Long-press a folder to choose it directly.
        </Text>
      </View>
    </SafeAreaView>
  );
}
