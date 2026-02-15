import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { usePhotoSync } from '@/providers/photo-sync-provider';
import type { FilenameStrategy, FolderStrategy, SmbConfig, SyncSettings } from '@/types/photosync';
import { Reveal } from '@/components/ui/reveal';

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
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
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextWrap}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#345267', true: '#ffbe63' }}
        thumbColor={value ? '#10263a' : '#dbe7f3'}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const {
    isReady,
    smbConfig,
    smbPassword,
    syncSettings,
    uploaderImplementation,
    saveConnectionSettings,
    saveSyncSettings,
  } = usePhotoSync();

  const [localConfig, setLocalConfig] = useState<SmbConfig>(smbConfig);
  const [password, setPassword] = useState(smbPassword);
  const [localSettings, setLocalSettings] = useState<SyncSettings>(syncSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalConfig(smbConfig);
  }, [smbConfig]);

  useEffect(() => {
    setPassword(smbPassword);
  }, [smbPassword]);

  useEffect(() => {
    setLocalSettings(syncSettings);
  }, [syncSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveConnectionSettings(
          {
            ...localConfig,
            port: Number.isFinite(localConfig.port) ? localConfig.port : 445,
          },
          password
        ),
        saveSyncSettings(localSettings),
      ]);

      Alert.alert('Saved', 'Settings were updated.');
    } catch (error) {
      Alert.alert('Save failed', String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const setPort = (value: string) => {
    const parsed = Number.parseInt(value, 10);

    setLocalConfig((current) => ({
      ...current,
      port: Number.isFinite(parsed) ? parsed : 445,
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
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.background}>
        <LinearGradient
          colors={['#04111e', '#0b2236', '#0a1d2f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(255,138,0,0.16)', 'rgba(255,138,0,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orbTop}
        />
        <LinearGradient
          colors={['rgba(66,152,255,0.15)', 'rgba(66,152,255,0.01)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.orbBottom}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal delay={20}>
          <LinearGradient
            colors={['rgba(255,138,0,0.22)', 'rgba(27,57,89,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}>
            <Text style={styles.heroLabel}>Connection</Text>
            <Text style={styles.heroTitle}>SMB / NAS Target</Text>
            <Text style={styles.heroText}>
              Configure host, credentials, media filters, background cadence, and naming strategy.
            </Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Host</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {localConfig.host || 'Not set'}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaLabel}>Share</Text>
                <Text numberOfLines={1} style={styles.heroMetaValue}>
                  {localConfig.share || 'Not set'}
                </Text>
              </View>
            </View>
            <Text style={styles.implementationText}>Uploader: {uploaderImplementation}</Text>
          </LinearGradient>
        </Reveal>

        <Reveal delay={80}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Server</Text>
              <Text style={styles.cardHint}>NAS endpoint and authentication details</Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Host (e.g. 192.168.1.100)"
              placeholderTextColor="#8ea8ba"
              autoCapitalize="none"
              autoCorrect={false}
              value={localConfig.host}
              onChangeText={(value) => setLocalConfig((current) => ({ ...current, host: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Port"
              placeholderTextColor="#8ea8ba"
              keyboardType="number-pad"
              value={String(localConfig.port)}
              onChangeText={setPort}
            />
            <TextInput
              style={styles.input}
              placeholder="Share name"
              placeholderTextColor="#8ea8ba"
              autoCapitalize="none"
              autoCorrect={false}
              value={localConfig.share}
              onChangeText={(value) => setLocalConfig((current) => ({ ...current, share: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Remote base path (e.g. /Camera Roll)"
              placeholderTextColor="#8ea8ba"
              autoCapitalize="none"
              autoCorrect={false}
              value={localConfig.remotePath}
              onChangeText={(value) => setLocalConfig((current) => ({ ...current, remotePath: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#8ea8ba"
              autoCapitalize="none"
              autoCorrect={false}
              value={localConfig.username}
              onChangeText={(value) => setLocalConfig((current) => ({ ...current, username: value }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#8ea8ba"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
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
              subtitle="Register periodic background checks for new media."
              value={localSettings.backgroundSyncEnabled}
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

        <Reveal delay={200}>
          <Pressable
            accessibilityRole="button"
            disabled={!isReady || isSaving}
            onPress={handleSave}
            style={[styles.saveButton, (!isReady || isSaving) && styles.saveButtonDisabled]}>
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
          </Pressable>
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
    paddingBottom: 28,
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
  heroLabel: {
    color: '#ffd290',
    fontFamily: Fonts.rounded,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    color: '#f8fbff',
    fontFamily: Fonts.rounded,
    fontSize: 29,
    lineHeight: 33,
  },
  heroText: {
    marginTop: 10,
    color: '#dce8f5',
    fontSize: 14,
    lineHeight: 20,
  },
  heroMetaRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  heroMeta: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(13, 24, 35, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroMetaLabel: {
    color: '#98b3cc',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroMetaValue: {
    marginTop: 3,
    color: '#f4f9ff',
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
  implementationText: {
    marginTop: 12,
    color: '#9ab9d3',
    fontSize: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(6, 23, 37, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(153, 184, 214, 0.2)',
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#f4f8fd',
    fontFamily: Fonts.rounded,
    fontSize: 18,
  },
  cardHint: {
    color: '#9ab4ca',
    fontSize: 12,
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(159, 190, 216, 0.24)',
    backgroundColor: 'rgba(20, 44, 63, 0.72)',
    color: '#e7f2f9',
    fontSize: 14,
  },
  inputLabel: {
    marginTop: 4,
    color: '#b8cddd',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(131, 160, 183, 0.14)',
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: '#e5f1f7',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#93afc2',
    fontSize: 12,
    lineHeight: 17,
  },
  segmentSection: {
    gap: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(159, 190, 216, 0.24)',
    backgroundColor: 'rgba(20, 44, 63, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#ff9b2a',
    borderColor: '#ff9b2a',
  },
  segmentButtonText: {
    color: '#bdd0de',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentButtonTextActive: {
    color: '#092034',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9b2a',
    marginBottom: 4,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#092034',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
});
