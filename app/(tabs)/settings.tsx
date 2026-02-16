import { isRunningInExpoGo } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Reveal } from '@/components/ui/reveal';
import { Fonts } from '@/constants/theme';
import { usePhotoSync } from '@/providers/photo-sync-provider';
import type {
  FilenameStrategy,
  FolderStrategy,
  SftpConfig,
  SmbConfig,
  SyncSettings,
  TransportType,
} from '@/types/photosync';

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

function normalizeSmbConfig(config: SmbConfig): SmbConfig {
  return {
    host: config.host.trim(),
    port: Number.isFinite(config.port) ? Math.max(1, Math.min(65535, Math.trunc(config.port))) : 445,
    share: config.share.trim(),
    remotePath: (config.remotePath ?? '').trim() || '/Camera Roll',
    username: config.username.trim(),
  };
}

function normalizeSftpConfig(config: SftpConfig): SftpConfig {
  return {
    host: config.host.trim(),
    port: Number.isFinite(config.port) ? Math.max(1, Math.min(65535, Math.trunc(config.port))) : 22,
    remotePath: (config.remotePath ?? '').trim() || '/home/user/photos',
    username: config.username.trim(),
    authType: config.authType === 'key' ? 'key' : 'password',
  };
}

function normalizeSyncSettings(settings: SyncSettings): SyncSettings {
  return {
    autoScanOnLaunch: Boolean(settings.autoScanOnLaunch),
    backgroundSyncEnabled: Boolean(settings.backgroundSyncEnabled),
    maxItemsPerRun: Math.max(1, Math.min(500, Math.trunc(settings.maxItemsPerRun))),
    uploadPhotos: Boolean(settings.uploadPhotos),
    uploadVideos: Boolean(settings.uploadVideos),
    wifiOnly: Boolean(settings.wifiOnly),
    maxRetryAttempts: Math.max(1, Math.min(10, Math.trunc(settings.maxRetryAttempts))),
    backgroundIntervalMinutes: Math.max(15, Math.min(720, Math.trunc(settings.backgroundIntervalMinutes))),
    folderStrategy: settings.folderStrategy === 'flat' ? 'flat' : 'byMonth',
    filenameStrategy: settings.filenameStrategy === 'timestampPrefix' ? 'timestampPrefix' : 'original',
    clearCompletedAfterDays: Math.max(0, Math.min(90, Math.trunc(settings.clearCompletedAfterDays))),
    transportType: settings.transportType === 'sftp' ? 'sftp' : 'smb',
  };
}

function SegmentedControl<T extends string>({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmentSection}>
      <Text style={styles.inputLabel}>{title}</Text>
      <View style={styles.segmentedRow}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onChange(option.value)}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}>
              <Text style={[styles.segmentButtonText, isActive && styles.segmentButtonTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={styles.toggleTextWrap}>
        <Text style={[styles.toggleTitle, disabled && styles.toggleTextDisabled]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, disabled && styles.toggleTextDisabled]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#39393D', true: '#FF9F0A' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    isReady,
    smbConfig,
    smbPassword,
    sftpConfig,
    sftpPassword,
    syncSettings,
    uploaderImplementation,
    saveConnectionSettings,
    testServerConnection,
    saveSyncSettings,
  } = usePhotoSync();
  const isExpoGoClient = useMemo(() => isRunningInExpoGo(), []);
  const backgroundSyncSubtitle = isExpoGoClient
    ? 'Unavailable in Expo Go. Use a development build for periodic background checks.'
    : 'Register periodic background checks for new media.';

  const [localSmbConfig, setLocalSmbConfig] = useState<SmbConfig>(smbConfig);
  const [localSmbPassword, setLocalSmbPassword] = useState(smbPassword);
  const [localSftpConfig, setLocalSftpConfig] = useState<SftpConfig>(sftpConfig);
  const [localSftpPassword, setLocalSftpPassword] = useState(sftpPassword);
  const [localSettings, setLocalSettings] = useState<SyncSettings>(syncSettings);
  const [transportType, setTransportType] = useState<TransportType>(localSettings.transportType || 'smb');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestStatus, setConnectionTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionTestMessage, setConnectionTestMessage] = useState('');

  useEffect(() => {
    setLocalSmbConfig(smbConfig);
  }, [smbConfig]);

  useEffect(() => {
    setLocalSmbPassword(smbPassword);
  }, [smbPassword]);

  useEffect(() => {
    setLocalSftpConfig(sftpConfig);
  }, [sftpConfig]);

  useEffect(() => {
    setLocalSftpPassword(sftpPassword);
  }, [sftpPassword]);

  useEffect(() => {
    setLocalSettings(syncSettings);
  }, [syncSettings]);

  useEffect(() => {
    setTransportType(syncSettings.transportType || 'smb');
  }, [syncSettings.transportType]);

  useEffect(() => {
    setConnectionTestStatus('idle');
    setConnectionTestMessage('');
  }, [
    localSmbConfig.host,
    localSmbConfig.port,
    localSmbConfig.remotePath,
    localSmbConfig.share,
    localSmbConfig.username,
    localSmbPassword,
    localSftpConfig.host,
    localSftpConfig.port,
    localSftpConfig.remotePath,
    localSftpConfig.username,
    localSftpPassword,
    transportType,
  ]);

  const normalizedLocalSmbConfig = useMemo(
    () => normalizeSmbConfig(localSmbConfig),
    [localSmbConfig]
  );
  const normalizedSavedSmbConfig = useMemo(() => normalizeSmbConfig(smbConfig), [smbConfig]);
  const normalizedLocalSftpConfig = useMemo(
    () => normalizeSftpConfig(localSftpConfig),
    [localSftpConfig]
  );
  const normalizedSavedSftpConfig = useMemo(
    () => normalizeSftpConfig(sftpConfig),
    [sftpConfig]
  );
  const normalizedLocalSettings = useMemo(() => normalizeSyncSettings(localSettings), [localSettings]);
  const normalizedSavedSettings = useMemo(() => normalizeSyncSettings(syncSettings), [syncSettings]);

  const hasSmbConnectionChanges =
    JSON.stringify(normalizedLocalSmbConfig) !== JSON.stringify(normalizedSavedSmbConfig) ||
    localSmbPassword.trim() !== smbPassword.trim();
  const hasSftpConnectionChanges =
    JSON.stringify(normalizedLocalSftpConfig) !== JSON.stringify(normalizedSavedSftpConfig) ||
    localSftpPassword.trim() !== sftpPassword.trim();
  const hasSyncChanges = JSON.stringify(normalizedLocalSettings) !== JSON.stringify(normalizedSavedSettings);
  const hasUnsavedChanges = hasSmbConnectionChanges || hasSftpConnectionChanges || hasSyncChanges;

  const activeConfig = transportType === 'sftp' ? localSftpConfig : localSmbConfig;
  const activePassword = transportType === 'sftp' ? localSftpPassword : localSmbPassword;

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    setIsSaving(true);
    try {
      const operations: Array<Promise<void>> = [];

      if (hasSmbConnectionChanges) {
        operations.push(
          saveConnectionSettings('smb', normalizedLocalSmbConfig, localSmbPassword)
        );
      }
      if (hasSftpConnectionChanges) {
        operations.push(
          saveConnectionSettings('sftp', normalizedLocalSftpConfig, localSftpPassword)
        );
      }
      if (hasSyncChanges) {
        operations.push(saveSyncSettings(normalizedLocalSettings));
      }

      await Promise.all(operations);

      Alert.alert('Saved', 'Settings were updated.');
    } catch (error) {
      Alert.alert('Save failed', String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestStatus('idle');
    setConnectionTestMessage('');

    try {
      const normalizedConfig =
        transportType === 'sftp' ? normalizeSftpConfig(activeConfig as SftpConfig) : normalizeSmbConfig(activeConfig as SmbConfig);
      const result = await testServerConnection(transportType, normalizedConfig, activePassword);

      if (result.ok) {
        await saveConnectionSettings(transportType, normalizedConfig, activePassword);
      }

      const latencySuffix = result.latencyMs !== undefined ? ` (${result.latencyMs}ms)` : '';
      setConnectionTestStatus(result.ok ? 'success' : 'error');
      setConnectionTestMessage(
        result.ok
          ? `${result.message}${latencySuffix} Connection settings saved.`
          : `${result.message}${latencySuffix}`
      );
    } catch (error) {
      setConnectionTestStatus('error');
      setConnectionTestMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTestingConnection(false);
    }
  };

  const setPort = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    const fallbackPort = transportType === 'sftp' ? 22 : 445;

    if (transportType === 'sftp') {
      setLocalSftpConfig((current) => ({
        ...current,
        port: Number.isFinite(parsed) ? parsed : fallbackPort,
      }));
      return;
    }

    setLocalSmbConfig((current) => ({
      ...current,
      port: Number.isFinite(parsed) ? parsed : fallbackPort,
    }));
  };

  const setNumberField = (
    key: 'maxItemsPerRun' | 'maxRetryAttempts' | 'backgroundIntervalMinutes' | 'clearCompletedAfterDays',
    value: string
  ) => {
    const parsed = Number.parseInt(value, 10);

    setLocalSettings((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : current[key],
    }));
  };

  const setFolderStrategy = (strategy: FolderStrategy) => {
    setLocalSettings((current) => ({
      ...current,
      folderStrategy: strategy,
    }));
  };

  const setFilenameStrategy = (strategy: FilenameStrategy) => {
    setLocalSettings((current) => ({
      ...current,
      filenameStrategy: strategy,
    }));
  };

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
          colors={['rgba(255,159,10,0.1)', 'rgba(255,159,10,0.0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.orbTop}
        />
        <LinearGradient
          colors={['rgba(10,132,255,0.08)', 'rgba(10,132,255,0.0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbBottom}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal delay={20}>
          <LinearGradient
            colors={['rgba(255,159,10,0.15)', 'rgba(28,28,30,0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.heroLabel}>Connection</Text>
            <Text style={styles.heroTitle}>
              {transportType === 'smb' ? 'SMB / NAS Target' : 'SFTP / SSH Target'}
            </Text>
            <Text style={styles.heroText}>
              Configure endpoint, credentials, sync policy, retention, and background cadence.
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Host</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {activeConfig.host || 'Not set'}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>
                  {transportType === 'smb' ? 'Share' : 'Remote Path'}
                </Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {transportType === 'smb'
                    ? (activeConfig as SmbConfig).share || 'Not set'
                    : activeConfig.remotePath || 'Not set'}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>State</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {hasUnsavedChanges ? 'Unsaved changes' : 'Synced'}
                </Text>
              </View>
            </View>
            <Text style={styles.implementationText}>Uploader: {uploaderImplementation}</Text>
          </LinearGradient>
        </Reveal>

        <Reveal delay={80}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Connection</Text>
              <Text style={styles.cardHint}>
                {transportType === 'smb'
                  ? 'SMB/NAS server details'
                  : 'SFTP/SSH server details'}
              </Text>
            </View>

            <SegmentedControl
              title="Protocol"
              value={transportType}
              options={[
                { label: 'SMB / NAS', value: 'smb' },
                { label: 'SFTP / SSH', value: 'sftp' },
              ]}
              onChange={(value) => {
                setTransportType(value);
                setLocalSettings((current) => ({
                  ...current,
                  transportType: value,
                }));
              }}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Server Details</Text>

            <TextInput
              style={styles.input}
              placeholder={transportType === 'smb'
                ? "Host (e.g. 192.168.1.100)"
                : "Host (e.g. example.com or 192.168.1.100)"}
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              value={activeConfig.host}
              onChangeText={(value) => {
                if (transportType === 'sftp') {
                  setLocalSftpConfig((current) => ({ ...current, host: value }));
                } else {
                  setLocalSmbConfig((current) => ({ ...current, host: value }));
                }
              }}
            />
            <TextInput
              style={styles.input}
              placeholder={transportType === 'smb' ? "Port (default 445)" : "Port (default 22)"}
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              keyboardType="number-pad"
              value={String(activeConfig.port)}
              onChangeText={setPort}
            />

            {transportType === 'smb' && (
              <TextInput
                style={styles.input}
                placeholder="Share name (e.g. Photos)"
                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                value={localSmbConfig.share}
                onChangeText={(value) =>
                  setLocalSmbConfig((current) => ({ ...current, share: value }))
                }
              />
            )}

            <TextInput
              style={styles.input}
              placeholder={transportType === 'smb'
                ? "Remote path (e.g. /Camera Roll)"
                : "Remote path (e.g. /home/user/photos)"}
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              value={activeConfig.remotePath}
              onChangeText={(value) => {
                if (transportType === 'sftp') {
                  setLocalSftpConfig((current) => ({ ...current, remotePath: value }));
                } else {
                  setLocalSmbConfig((current) => ({ ...current, remotePath: value }));
                }
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              value={activeConfig.username}
              onChangeText={(value) => {
                if (transportType === 'sftp') {
                  setLocalSftpConfig((current) => ({ ...current, username: value }));
                } else {
                  setLocalSmbConfig((current) => ({ ...current, username: value }));
                }
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={activePassword}
              onChangeText={(value) => {
                if (transportType === 'sftp') {
                  setLocalSftpPassword(value);
                } else {
                  setLocalSmbPassword(value);
                }
              }}
            />

            <View style={styles.connectionActionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={!isReady || isTestingConnection || isSaving}
                onPress={handleTestConnection}
                style={[
                  styles.testButton,
                  (!isReady || isTestingConnection || isSaving) && styles.testButtonDisabled,
                ]}>
                {isTestingConnection ? (
                  <ActivityIndicator color="#092034" />
                ) : (
                  <Text style={styles.testButtonText}>Test Connection</Text>
                )}
              </Pressable>
              {connectionTestMessage ? (
                <Text
                  accessibilityRole={connectionTestStatus === 'error' ? 'alert' : undefined}
                  style={[
                    styles.connectionTestMessage,
                    connectionTestStatus === 'success'
                      ? styles.connectionTestMessageSuccess
                      : styles.connectionTestMessageError,
                  ]}>
                  {connectionTestMessage}
                </Text>
              ) : null}
            </View>
          </View>
        </Reveal>

        <Reveal delay={140}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Sync Behavior</Text>
              <Text style={styles.cardHint}>Automation, network policy, and retention settings</Text>
            </View>

            <ToggleRow
              title="Auto-scan on launch"
              subtitle="Start one scan/upload pass whenever the app opens."
              value={localSettings.autoScanOnLaunch}
              onChange={(value) =>
                setLocalSettings((current) => ({
                  ...current,
                  autoScanOnLaunch: value,
                }))
              }
            />

            <ToggleRow
              title="Background sync"
              subtitle={backgroundSyncSubtitle}
              value={localSettings.backgroundSyncEnabled}
              disabled={isExpoGoClient}
              onChange={(value) =>
                setLocalSettings((current) => ({
                  ...current,
                  backgroundSyncEnabled: value,
                }))
              }
            />

            <ToggleRow
              title="Upload photos"
              subtitle="Include image assets from your Camera Roll."
              value={localSettings.uploadPhotos}
              onChange={(value) =>
                setLocalSettings((current) => ({
                  ...current,
                  uploadPhotos: value,
                }))
              }
            />

            <ToggleRow
              title="Upload videos"
              subtitle="Include video assets from your Camera Roll."
              value={localSettings.uploadVideos}
              onChange={(value) =>
                setLocalSettings((current) => ({
                  ...current,
                  uploadVideos: value,
                }))
              }
            />

            <ToggleRow
              title="Wi-Fi only"
              subtitle="Block uploads when the current connection is cellular."
              value={localSettings.wifiOnly}
              onChange={(value) =>
                setLocalSettings((current) => ({
                  ...current,
                  wifiOnly: value,
                }))
              }
            />

            <Text style={styles.inputLabel}>Max media items per sync pass</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localSettings.maxItemsPerRun)}
              onChangeText={(value) => setNumberField('maxItemsPerRun', value)}
            />

            <Text style={styles.inputLabel}>Retry attempts per item</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localSettings.maxRetryAttempts)}
              onChangeText={(value) => setNumberField('maxRetryAttempts', value)}
            />

            <Text style={styles.inputLabel}>Background interval (minutes)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localSettings.backgroundIntervalMinutes)}
              onChangeText={(value) => setNumberField('backgroundIntervalMinutes', value)}
            />

            <Text style={styles.inputLabel}>Auto-cleanup completed items older than days (0 disables)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={String(localSettings.clearCompletedAfterDays)}
              onChangeText={(value) => setNumberField('clearCompletedAfterDays', value)}
            />

            <SegmentedControl
              title="Folder strategy"
              value={localSettings.folderStrategy}
              options={[
                { label: 'By Month', value: 'byMonth' },
                { label: 'Flat', value: 'flat' },
              ]}
              onChange={setFolderStrategy}
            />

            <SegmentedControl
              title="Filename strategy"
              value={localSettings.filenameStrategy}
              options={[
                { label: 'Original', value: 'original' },
                { label: 'Timestamp Prefix', value: 'timestampPrefix' },
              ]}
              onChange={setFilenameStrategy}
            />
          </View>
        </Reveal>
      </ScrollView>

      <View style={styles.saveDockWrap}>
        <LinearGradient
          colors={['rgba(30, 30, 30, 0.95)', 'rgba(28, 28, 30, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveDock}>
          <Text style={styles.saveDockStatus}>{hasUnsavedChanges ? 'Unsaved changes' : 'All settings saved'}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!isReady || isSaving || !hasUnsavedChanges}
            onPress={handleSave}
            style={[styles.saveButton, (!isReady || isSaving || !hasUnsavedChanges) && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</Text>
          </Pressable>
        </LinearGradient>
      </View>
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
    top: -160,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    opacity: 0.5,
  },
  orbBottom: {
    position: 'absolute',
    bottom: -200,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.35,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 140,
    gap: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
    marginTop: 8,
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
    marginTop: 6,
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
  },
  heroText: {
    marginTop: 8,
    color: 'rgba(235, 235, 245, 0.6)',
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
    color: 'rgba(235, 235, 245, 0.3)',
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
  implementationText: {
    marginTop: 12,
    color: 'rgba(235, 235, 245, 0.3)',
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#1C1C1E',
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 20,
    fontWeight: '700',
  },
  cardHint: {
    color: 'rgba(235, 235, 245, 0.3)',
    fontSize: 13,
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#2C2C2E',
    color: '#FFFFFF',
    fontSize: 17,
  },
  inputLabel: {
    marginTop: 4,
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(84, 84, 88, 0.65)',
  },
  toggleRowDisabled: {
    opacity: 0.6,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  toggleSubtitle: {
    color: 'rgba(235, 235, 245, 0.3)',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleTextDisabled: {
    color: 'rgba(235, 235, 245, 0.45)',
  },
  segmentSection: {
    gap: 8,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.65)',
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(120, 120, 128, 0.4)',
  },
  segmentButtonText: {
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  connectionActionRow: {
    gap: 10,
    marginTop: 4,
  },
  testButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9F0A',
  },
  testButtonDisabled: {
    opacity: 0.4,
  },
  testButtonText: {
    color: '#000000',
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '600',
  },
  connectionTestMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  connectionTestMessageSuccess: {
    color: '#30D158',
  },
  connectionTestMessageError: {
    color: '#FF453A',
  },
  saveDockWrap: {
    position: 'relative',
    left: 0,
    right: 0,
    bottom: 90,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  saveDock: {
    borderRadius: 16,
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
  },
  saveDockStatus: {
    flex: 1,
    color: 'rgba(235, 235, 245, 0.6)',
    fontSize: 15,
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9F0A',
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: '#000000',
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '600',
  },
});
