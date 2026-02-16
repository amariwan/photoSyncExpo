import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import {
  DEFAULT_SFTP_CONFIG,
  DEFAULT_SMB_CONFIG,
  DEFAULT_SYNC_METADATA,
  DEFAULT_SYNC_SETTINGS,
  type SftpConfig,
  type SmbConfig,
  type SyncLogEntry,
  type SyncMetadata,
  type SyncSettings,
  type UploadItem,
} from '@/types/photosync';

const SETTINGS_KEY = 'photosync.settings';
const SMB_CONFIG_KEY = 'photosync.smbConfig';
const SFTP_CONFIG_KEY = 'photosync.sftpConfig';
const SYNC_METADATA_KEY = 'photosync.metadata';
const LOGS_KEY = 'photosync.logs';
const QUEUE_KEY = 'photosync.queue';
const SMB_PASSWORD_KEY = 'photosync.smbPassword';
const SMB_PASSWORD_FALLBACK_KEY = 'photosync.smbPassword.fallback';
const SFTP_PASSWORD_KEY = 'photosync.sftpPassword';
const SFTP_PASSWORD_FALLBACK_KEY = 'photosync.sftpPassword.fallback';

const MAX_LOG_ENTRIES = 200;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch {
    return fallback;
  }
}

function sanitizeSettings(input: Partial<SyncSettings>): SyncSettings {
  const maxItemsPerRun = Number.isFinite(input.maxItemsPerRun)
    ? Math.max(1, Math.min(500, Math.trunc(input.maxItemsPerRun!)))
    : DEFAULT_SYNC_SETTINGS.maxItemsPerRun;
  const maxRetryAttempts = Number.isFinite(input.maxRetryAttempts)
    ? Math.max(1, Math.min(10, Math.trunc(input.maxRetryAttempts!)))
    : DEFAULT_SYNC_SETTINGS.maxRetryAttempts;
  const backgroundIntervalMinutes = Number.isFinite(input.backgroundIntervalMinutes)
    ? Math.max(15, Math.min(720, Math.trunc(input.backgroundIntervalMinutes!)))
    : DEFAULT_SYNC_SETTINGS.backgroundIntervalMinutes;
  const clearCompletedAfterDays = Number.isFinite(input.clearCompletedAfterDays)
    ? Math.max(0, Math.min(90, Math.trunc(input.clearCompletedAfterDays!)))
    : DEFAULT_SYNC_SETTINGS.clearCompletedAfterDays;

  return {
    autoScanOnLaunch:
      typeof input.autoScanOnLaunch === 'boolean'
        ? input.autoScanOnLaunch
        : DEFAULT_SYNC_SETTINGS.autoScanOnLaunch,
    backgroundSyncEnabled:
      typeof input.backgroundSyncEnabled === 'boolean'
        ? input.backgroundSyncEnabled
        : DEFAULT_SYNC_SETTINGS.backgroundSyncEnabled,
    maxItemsPerRun,
    uploadPhotos:
      typeof input.uploadPhotos === 'boolean'
        ? input.uploadPhotos
        : DEFAULT_SYNC_SETTINGS.uploadPhotos,
    uploadVideos:
      typeof input.uploadVideos === 'boolean'
        ? input.uploadVideos
        : DEFAULT_SYNC_SETTINGS.uploadVideos,
    wifiOnly:
      typeof input.wifiOnly === 'boolean'
        ? input.wifiOnly
        : DEFAULT_SYNC_SETTINGS.wifiOnly,
    maxRetryAttempts,
    backgroundIntervalMinutes,
    folderStrategy:
      input.folderStrategy === 'flat' || input.folderStrategy === 'byMonth'
        ? input.folderStrategy
        : DEFAULT_SYNC_SETTINGS.folderStrategy,
    filenameStrategy:
      input.filenameStrategy === 'timestampPrefix' || input.filenameStrategy === 'original'
        ? input.filenameStrategy
        : DEFAULT_SYNC_SETTINGS.filenameStrategy,
    clearCompletedAfterDays,
    transportType:
      input.transportType === 'sftp' || input.transportType === 'smb'
        ? input.transportType
        : DEFAULT_SYNC_SETTINGS.transportType,
  };
}

function sanitizeSmbConfig(input: Partial<SmbConfig>): SmbConfig {
  const parsedPort = Number.isFinite(input.port) ? Math.trunc(input.port!) : DEFAULT_SMB_CONFIG.port;

  return {
    host: (input.host ?? '').trim(),
    port: Math.min(Math.max(parsedPort, 1), 65535),
    share: (input.share ?? '').trim(),
    remotePath: (input.remotePath ?? DEFAULT_SMB_CONFIG.remotePath).trim() || DEFAULT_SMB_CONFIG.remotePath,
    username: (input.username ?? '').trim(),
  };
}

function sanitizeSftpConfig(input: Partial<SftpConfig>): SftpConfig {
  const parsedPort = Number.isFinite(input.port) ? Math.trunc(input.port!) : DEFAULT_SFTP_CONFIG.port;

  return {
    host: (input.host ?? '').trim(),
    port: Math.min(Math.max(parsedPort, 1), 65535),
    remotePath: (input.remotePath ?? DEFAULT_SFTP_CONFIG.remotePath).trim() || DEFAULT_SFTP_CONFIG.remotePath,
    username: (input.username ?? '').trim(),
    authType: input.authType === 'key' ? 'key' : 'password',
  };
}

export async function loadSettings(): Promise<SyncSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  const parsed = safeJsonParse<Partial<SyncSettings>>(raw, DEFAULT_SYNC_SETTINGS);

  return {
    ...DEFAULT_SYNC_SETTINGS,
    ...sanitizeSettings(parsed),
  };
}

export async function saveSettings(settings: SyncSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)));
}

export async function loadSmbConfig(): Promise<SmbConfig> {
  const raw = await AsyncStorage.getItem(SMB_CONFIG_KEY);
  const parsed = safeJsonParse<Partial<SmbConfig>>(raw, DEFAULT_SMB_CONFIG);

  return {
    ...DEFAULT_SMB_CONFIG,
    ...sanitizeSmbConfig(parsed),
  };
}

export async function saveSmbConfig(config: SmbConfig): Promise<void> {
  await AsyncStorage.setItem(SMB_CONFIG_KEY, JSON.stringify(sanitizeSmbConfig(config)));
}

export async function loadSftpConfig(): Promise<SftpConfig> {
  const raw = await AsyncStorage.getItem(SFTP_CONFIG_KEY);
  const parsed = safeJsonParse<Partial<SftpConfig>>(raw, DEFAULT_SFTP_CONFIG);

  return {
    ...DEFAULT_SFTP_CONFIG,
    ...sanitizeSftpConfig(parsed),
  };
}

export async function saveSftpConfig(config: SftpConfig): Promise<void> {
  await AsyncStorage.setItem(SFTP_CONFIG_KEY, JSON.stringify(sanitizeSftpConfig(config)));
}

export async function loadSyncMetadata(): Promise<SyncMetadata> {
  const raw = await AsyncStorage.getItem(SYNC_METADATA_KEY);
  const parsed = safeJsonParse<Partial<SyncMetadata>>(raw, DEFAULT_SYNC_METADATA);

  return {
    lastSyncedAssetTime:
      typeof parsed.lastSyncedAssetTime === 'number' ? parsed.lastSyncedAssetTime : null,
    lastCompletedAt: typeof parsed.lastCompletedAt === 'number' ? parsed.lastCompletedAt : null,
  };
}

export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  await AsyncStorage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
}

export async function loadLogs(): Promise<SyncLogEntry[]> {
  const raw = await AsyncStorage.getItem(LOGS_KEY);
  const parsed = safeJsonParse<SyncLogEntry[]>(raw, []);

  return parsed
    .filter((entry) => entry && typeof entry.message === 'string')
    .slice(0, MAX_LOG_ENTRIES);
}

export async function saveLogs(logs: SyncLogEntry[]): Promise<void> {
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, MAX_LOG_ENTRIES)));
}

export async function loadQueue(): Promise<UploadItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const parsed = safeJsonParse<UploadItem[]>(raw, []);

  return parsed
    .filter((item) => item && typeof item.id === 'string' && typeof item.filename === 'string')
    .map((item) => ({
      id: item.id,
      filename: item.filename,
      localUri: item.localUri,
      mediaType: item.mediaType === 'video' ? 'video' : 'photo',
      creationTime: Number.isFinite(item.creationTime) ? item.creationTime : Date.now(),
      progress: Number.isFinite(item.progress) ? Math.max(0, Math.min(1, item.progress)) : 0,
      status:
        item.status === 'completed' ||
        item.status === 'failed' ||
        item.status === 'uploading' ||
        item.status === 'pending'
          ? item.status
          : 'pending',
      attemptCount: Number.isFinite(item.attemptCount) ? Math.max(0, Math.trunc(item.attemptCount)) : 0,
      lastAttemptAt: Number.isFinite(item.lastAttemptAt) ? item.lastAttemptAt : null,
      uploadedAt: Number.isFinite(item.uploadedAt) ? item.uploadedAt : null,
      errorMessage: item.errorMessage,
    }));
}

export async function saveQueue(queue: UploadItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function loadSmbPassword(): Promise<string> {
  try {
    const value = await SecureStore.getItemAsync(SMB_PASSWORD_KEY);
    if (value != null) {
      return value;
    }
  } catch {
    // Ignore and fall back to AsyncStorage.
  }

  const fallback = await AsyncStorage.getItem(SMB_PASSWORD_FALLBACK_KEY);
  return fallback ?? '';
}

export async function saveSmbPassword(password: string): Promise<void> {
  const normalized = password.trim();

  if (!normalized) {
    await clearSmbPassword();
    return;
  }

  try {
    await SecureStore.setItemAsync(SMB_PASSWORD_KEY, normalized);
    await AsyncStorage.removeItem(SMB_PASSWORD_FALLBACK_KEY);
    return;
  } catch {
    // Continue to AsyncStorage fallback.
  }

  await AsyncStorage.setItem(SMB_PASSWORD_FALLBACK_KEY, normalized);
}

export async function clearSmbPassword(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SMB_PASSWORD_KEY);
  } catch {
    // Ignore secure-store errors.
  }

  await AsyncStorage.removeItem(SMB_PASSWORD_FALLBACK_KEY);
}

export async function loadSftpPassword(): Promise<string> {
  try {
    const value = await SecureStore.getItemAsync(SFTP_PASSWORD_KEY);
    if (value != null) {
      return value;
    }
  } catch {
    // Ignore and fall back to AsyncStorage.
  }

  const fallback = await AsyncStorage.getItem(SFTP_PASSWORD_FALLBACK_KEY);
  return fallback ?? '';
}

export async function saveSftpPassword(password: string): Promise<void> {
  const normalized = password.trim();

  if (!normalized) {
    await clearSftpPassword();
    return;
  }

  try {
    await SecureStore.setItemAsync(SFTP_PASSWORD_KEY, normalized);
    await AsyncStorage.removeItem(SFTP_PASSWORD_FALLBACK_KEY);
    return;
  } catch {
    // Continue to AsyncStorage fallback.
  }

  await AsyncStorage.setItem(SFTP_PASSWORD_FALLBACK_KEY, normalized);
}

export async function clearSftpPassword(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SFTP_PASSWORD_KEY);
  } catch {
    // Ignore secure-store errors.
  }

  await AsyncStorage.removeItem(SFTP_PASSWORD_FALLBACK_KEY);
}
