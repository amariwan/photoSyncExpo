export type PermissionState = 'unknown' | 'granted' | 'denied';

export type SyncPhase = 'idle' | 'scanning' | 'syncing';

export type UploadItemStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export type SyncLogLevel = 'info' | 'error';

export type FolderStrategy = 'byMonth' | 'flat';

export type FilenameStrategy = 'original' | 'timestampPrefix';

export interface SmbConfig {
  host: string;
  port: number;
  share: string;
  remotePath: string;
  username: string;
}

export interface SyncSettings {
  autoScanOnLaunch: boolean;
  backgroundSyncEnabled: boolean;
  maxItemsPerRun: number;
  uploadPhotos: boolean;
  uploadVideos: boolean;
  wifiOnly: boolean;
  maxRetryAttempts: number;
  backgroundIntervalMinutes: number;
  folderStrategy: FolderStrategy;
  filenameStrategy: FilenameStrategy;
  clearCompletedAfterDays: number;
}

export interface SyncMetadata {
  lastSyncedAssetTime: number | null;
  lastCompletedAt: number | null;
}

export interface UploadItem {
  id: string;
  filename: string;
  localUri: string;
  mediaType: 'photo' | 'video';
  creationTime: number;
  progress: number;
  status: UploadItemStatus;
  attemptCount: number;
  lastAttemptAt: number | null;
  uploadedAt: number | null;
  errorMessage?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  level: SyncLogLevel;
  message: string;
}

export const DEFAULT_SMB_CONFIG: SmbConfig = {
  host: '',
  port: 445,
  share: '',
  remotePath: '/Camera Roll',
  username: '',
};

export const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoScanOnLaunch: true,
  backgroundSyncEnabled: false,
  maxItemsPerRun: 100,
  uploadPhotos: true,
  uploadVideos: true,
  wifiOnly: false,
  maxRetryAttempts: 3,
  backgroundIntervalMinutes: 15,
  folderStrategy: 'byMonth',
  filenameStrategy: 'original',
  clearCompletedAfterDays: 7,
};

export const DEFAULT_SYNC_METADATA: SyncMetadata = {
  lastSyncedAssetTime: null,
  lastCompletedAt: null,
};
