import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { checkNetworkGate } from '@/services/photosync/network';
import {
  getMediaPermissionState,
  requestMediaPermission,
  scanNewCameraRollMedia,
} from '@/services/photosync/media-scanner';
import {
  loadLogs,
  loadQueue,
  loadSmbConfig,
  loadSmbPassword,
  loadSettings,
  loadSyncMetadata,
  saveLogs,
  saveQueue,
  saveSmbConfig,
  saveSmbPassword,
  saveSettings,
  saveSyncMetadata,
} from '@/services/photosync/storage';
import {
  buildRemotePath,
  MockSmbUploader,
  validateSmbConfig,
} from '@/services/photosync/smb-uploader';
import {
  setBackgroundSyncRunner,
  syncBackgroundTaskRegistration,
} from '@/services/photosync/background-task';
import {
  DEFAULT_SMB_CONFIG,
  DEFAULT_SYNC_METADATA,
  DEFAULT_SYNC_SETTINGS,
  type PermissionState,
  type SmbConfig,
  type SyncLogEntry,
  type SyncLogLevel,
  type SyncMetadata,
  type SyncPhase,
  type SyncSettings,
  type UploadItem,
} from '@/types/photosync';

const uploader = new MockSmbUploader();
const MAX_LOG_ENTRIES = 200;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface RunSyncOptions {
  silent?: boolean;
  trigger?: 'manual' | 'background' | 'launch';
}

interface PhotoSyncContextValue {
  isReady: boolean;
  phase: SyncPhase;
  permissionState: PermissionState;
  smbConfig: SmbConfig;
  smbPassword: string;
  syncSettings: SyncSettings;
  metadata: SyncMetadata;
  queue: UploadItem[];
  logs: SyncLogEntry[];
  uploaderImplementation: string;
  cancelAfterCurrentItem: boolean;
  requestPhotoPermission: () => Promise<PermissionState>;
  saveConnectionSettings: (config: SmbConfig, password: string) => Promise<void>;
  saveSyncSettings: (settings: SyncSettings) => Promise<void>;
  scanForNewMedia: () => Promise<number>;
  runSync: (options?: RunSyncOptions) => Promise<number>;
  requestCancelAfterCurrentItem: () => void;
  retryFailedUploads: () => void;
  clearCompletedUploads: () => void;
  clearFailedUploads: () => void;
  clearAllUploads: () => void;
}

const PhotoSyncContext = createContext<PhotoSyncContextValue | null>(null);

function createLog(level: SyncLogLevel, message: string): SyncLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: Date.now(),
    level,
    message,
  };
}

function mergeQueueItems(existing: UploadItem[], discovered: UploadItem[]): UploadItem[] {
  const existingIds = new Set(existing.map((item) => item.id));
  const merged = [...existing];

  for (const item of discovered) {
    if (!existingIds.has(item.id)) {
      merged.push(item);
      existingIds.add(item.id);
    }
  }

  return merged.sort((a, b) => a.creationTime - b.creationTime);
}

function updateUploadItem(
  currentQueue: UploadItem[],
  itemId: string,
  update: Partial<UploadItem>
): UploadItem[] {
  return currentQueue.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    return {
      ...item,
      ...update,
    };
  });
}

function trimLogs(logs: SyncLogEntry[]): SyncLogEntry[] {
  return logs.slice(0, MAX_LOG_ENTRIES);
}

function normalizeLoadedQueue(queue: UploadItem[]): UploadItem[] {
  return queue
    .map((item) => {
      if (item.status !== 'uploading') {
        return item;
      }

      return {
        ...item,
        status: 'failed' as const,
        errorMessage: item.errorMessage ?? 'Upload was interrupted. Retry the item.',
      };
    })
    .sort((a, b) => a.creationTime - b.creationTime);
}

function cleanupCompletedQueue(
  queue: UploadItem[],
  clearCompletedAfterDays: number
): { queue: UploadItem[]; removed: number } {
  if (clearCompletedAfterDays <= 0) {
    return { queue, removed: 0 };
  }

  const threshold = Date.now() - clearCompletedAfterDays * ONE_DAY_MS;
  let removed = 0;

  const cleaned = queue.filter((item) => {
    if (item.status !== 'completed') {
      return true;
    }

    const completedAt = item.uploadedAt ?? item.creationTime;
    const keep = completedAt >= threshold;
    if (!keep) {
      removed += 1;
    }

    return keep;
  });

  return removed > 0 ? { queue: cleaned, removed } : { queue, removed: 0 };
}

export function PhotoSyncProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [phase, setPhase] = useState<SyncPhase>('idle');
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [smbConfig, setSmbConfig] = useState<SmbConfig>(DEFAULT_SMB_CONFIG);
  const [smbPassword, setSmbPassword] = useState('');
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);
  const [metadata, setMetadata] = useState<SyncMetadata>(DEFAULT_SYNC_METADATA);
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [cancelAfterCurrentItem, setCancelAfterCurrentItem] = useState(false);

  const phaseRef = useRef(phase);
  const permissionStateRef = useRef(permissionState);
  const smbConfigRef = useRef(smbConfig);
  const smbPasswordRef = useRef(smbPassword);
  const syncSettingsRef = useRef(syncSettings);
  const metadataRef = useRef(metadata);
  const queueRef = useRef(queue);
  const cancelAfterCurrentItemRef = useRef(cancelAfterCurrentItem);
  const launchScanDoneRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    permissionStateRef.current = permissionState;
  }, [permissionState]);

  useEffect(() => {
    smbConfigRef.current = smbConfig;
  }, [smbConfig]);

  useEffect(() => {
    smbPasswordRef.current = smbPassword;
  }, [smbPassword]);

  useEffect(() => {
    syncSettingsRef.current = syncSettings;
  }, [syncSettings]);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    cancelAfterCurrentItemRef.current = cancelAfterCurrentItem;
  }, [cancelAfterCurrentItem]);

  const setQueueState = useCallback((updater: (current: UploadItem[]) => UploadItem[]) => {
    setQueue((current) => {
      const next = updater(current);
      queueRef.current = next;
      return next;
    });
  }, []);

  const appendLog = useCallback((level: SyncLogLevel, message: string) => {
    setLogs((current) => trimLogs([createLog(level, message), ...current]));
  }, []);

  const applyCompletedCleanup = useCallback(
    (settings: SyncSettings, silent: boolean = false): number => {
      let removed = 0;

      setQueueState((current) => {
        const cleanup = cleanupCompletedQueue(current, settings.clearCompletedAfterDays);
        removed = cleanup.removed;
        return cleanup.queue;
      });

      if (removed > 0 && !silent) {
        appendLog(
          'info',
          `Auto-cleanup removed ${removed} completed item(s) older than ${settings.clearCompletedAfterDays} day(s).`
        );
      }

      return removed;
    },
    [appendLog, setQueueState]
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void saveLogs(logs);
  }, [isReady, logs]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void saveQueue(queue);
  }, [isReady, queue]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialState = async () => {
      try {
        const [
          loadedSettings,
          loadedSmbConfig,
          loadedPassword,
          loadedMetadata,
          loadedLogs,
          loadedQueue,
        ] = await Promise.all([
          loadSettings(),
          loadSmbConfig(),
          loadSmbPassword(),
          loadSyncMetadata(),
          loadLogs(),
          loadQueue(),
        ]);

        const permission = await getMediaPermissionState().catch(() => 'unknown' as const);

        if (cancelled) {
          return;
        }

        const normalizedQueue = normalizeLoadedQueue(loadedQueue);
        const cleanedQueue = cleanupCompletedQueue(
          normalizedQueue,
          loadedSettings.clearCompletedAfterDays
        ).queue;

        setSyncSettings(loadedSettings);
        setSmbConfig(loadedSmbConfig);
        setSmbPassword(loadedPassword);
        setMetadata(loadedMetadata);
        setLogs(trimLogs(loadedLogs));
        setQueue(cleanedQueue);
        setPermissionState(permission);
        setIsReady(true);
      } catch (error) {
        if (!cancelled) {
          setIsReady(true);
          const errorMessage = error instanceof Error ? error.message : String(error);
          appendLog('error', `Failed to load initial state: ${errorMessage}`);
        }
      }
    };

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, [appendLog]);

  const requestPhotoPermission = useCallback(async (): Promise<PermissionState> => {
    const nextState = await requestMediaPermission().catch(() => 'denied' as const);
    setPermissionState(nextState);

    if (nextState === 'granted') {
      appendLog('info', 'Photo library permission granted.');
    } else {
      appendLog('error', 'Photo library permission was not granted.');
    }

    return nextState;
  }, [appendLog]);

  const saveConnectionSettings = useCallback(
    async (config: SmbConfig, password: string): Promise<void> => {
      const normalizedConfig: SmbConfig = {
        host: config.host.trim(),
        port: Number.isFinite(config.port) ? Math.trunc(config.port) : DEFAULT_SMB_CONFIG.port,
        share: config.share.trim(),
        remotePath: config.remotePath.trim() || DEFAULT_SMB_CONFIG.remotePath,
        username: config.username.trim(),
      };

      await Promise.all([saveSmbConfig(normalizedConfig), saveSmbPassword(password)]);

      setSmbConfig(normalizedConfig);
      setSmbPassword(password.trim());
      appendLog('info', 'Connection settings saved.');
    },
    [appendLog]
  );

  const saveSyncSettingsHandler = useCallback(
    async (settings: SyncSettings): Promise<void> => {
      const normalized: SyncSettings = {
        autoScanOnLaunch: Boolean(settings.autoScanOnLaunch),
        backgroundSyncEnabled: Boolean(settings.backgroundSyncEnabled),
        maxItemsPerRun: Math.max(1, Math.min(500, Math.trunc(settings.maxItemsPerRun))),
        uploadPhotos: Boolean(settings.uploadPhotos),
        uploadVideos: Boolean(settings.uploadVideos),
        wifiOnly: Boolean(settings.wifiOnly),
        maxRetryAttempts: Math.max(1, Math.min(10, Math.trunc(settings.maxRetryAttempts))),
        backgroundIntervalMinutes: Math.max(
          15,
          Math.min(720, Math.trunc(settings.backgroundIntervalMinutes))
        ),
        folderStrategy: settings.folderStrategy === 'flat' ? 'flat' : 'byMonth',
        filenameStrategy:
          settings.filenameStrategy === 'timestampPrefix' ? 'timestampPrefix' : 'original',
        clearCompletedAfterDays: Math.max(
          0,
          Math.min(90, Math.trunc(settings.clearCompletedAfterDays))
        ),
      };

      await saveSettings(normalized);
      setSyncSettings(normalized);
      applyCompletedCleanup(normalized, true);
      appendLog('info', 'Sync settings saved.');
    },
    [appendLog, applyCompletedCleanup]
  );

  const scanForNewMedia = useCallback(async (): Promise<number> => {
    let currentPermission = permissionStateRef.current;

    if (currentPermission !== 'granted') {
      currentPermission = await requestMediaPermission().catch(() => 'denied' as const);
      setPermissionState(currentPermission);
    }

    if (currentPermission !== 'granted') {
      appendLog('error', 'Cannot scan without photo library permission.');
      return 0;
    }

    if (phaseRef.current !== 'idle') {
      return 0;
    }

    const filters = {
      uploadPhotos: syncSettingsRef.current.uploadPhotos,
      uploadVideos: syncSettingsRef.current.uploadVideos,
    };

    if (!filters.uploadPhotos && !filters.uploadVideos) {
      appendLog('error', 'Both media filters are disabled. Enable photos or videos in settings.');
      return 0;
    }

    setPhase('scanning');

    try {
      const discovered = await scanNewCameraRollMedia(
        metadataRef.current.lastSyncedAssetTime,
        syncSettingsRef.current.maxItemsPerRun,
        filters
      );

      if (discovered.length === 0) {
        appendLog('info', 'No new media found for current filters.');
        return 0;
      }

      const discoveredQueueItems: UploadItem[] = discovered.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        localUri: asset.localUri,
        mediaType: asset.mediaType,
        creationTime: asset.creationTime,
        progress: 0,
        status: 'pending',
        attemptCount: 0,
        lastAttemptAt: null,
        uploadedAt: null,
      }));

      setQueueState((current) => mergeQueueItems(current, discoveredQueueItems));
      appendLog('info', `Discovered ${discovered.length} new item(s).`);
      return discovered.length;
    } catch (error) {
      appendLog('error', `Media scan failed: ${String(error)}`);
      return 0;
    } finally {
      setPhase('idle');
    }
  }, [appendLog, setQueueState]);

  const runSync = useCallback(
    async (options?: RunSyncOptions): Promise<number> => {
      if (phaseRef.current !== 'idle') {
        return 0;
      }

      setCancelAfterCurrentItem(false);

      const activeConfig = {
        ...smbConfigRef.current,
        password: smbPasswordRef.current,
      };

      const validationErrors = validateSmbConfig(activeConfig);
      if (validationErrors.length > 0) {
        appendLog('error', validationErrors[0]);
        return 0;
      }

      const networkGate = await checkNetworkGate(syncSettingsRef.current.wifiOnly).catch(() => ({
        ok: false,
        reason: 'Could not determine network state.',
      }));

      if (!networkGate.ok) {
        appendLog('error', networkGate.reason ?? 'Network policy blocked sync.');
        return 0;
      }
      applyCompletedCleanup(syncSettingsRef.current, { silent: true });
      applyCompletedCleanup(syncSettingsRef.current, true);

      const maxRetryAttempts = syncSettingsRef.current.maxRetryAttempts;
      let pendingItems = queueRef.current.filter(
        (item) =>
          (item.status === 'pending' || item.status === 'failed') && item.attemptCount < maxRetryAttempts
      );

      if (pendingItems.length === 0) {
        await scanForNewMedia();
        pendingItems = queueRef.current.filter(
          (item) =>
            (item.status === 'pending' || item.status === 'failed') &&
            item.attemptCount < maxRetryAttempts
        );
      }

      if (pendingItems.length === 0) {
        if (!options?.silent) {
          appendLog('info', 'Nothing to upload.');
        }
        return 0;
      }

      setPhase('syncing');

      let uploadedCount = 0;
      let maxSyncedTime = metadataRef.current.lastSyncedAssetTime ?? 0;

      try {
        for (const item of pendingItems) {
          if (cancelAfterCurrentItemRef.current) {
            appendLog('info', 'Sync stopped after current item as requested.');
            break;
          }

          const attemptCount = item.attemptCount + 1;
          const attemptStartedAt = Date.now();

          setQueueState((currentQueue) =>
            updateUploadItem(currentQueue, item.id, {
              status: 'uploading',
              progress: 0,
              errorMessage: undefined,
              attemptCount,
              lastAttemptAt: attemptStartedAt,
            })
          );

          const remotePath = buildRemotePath(
            activeConfig.remotePath,
            item,
            syncSettingsRef.current.folderStrategy,
            syncSettingsRef.current.filenameStrategy
          );

          try {
            await uploader.uploadFile(
              activeConfig,
              {
                assetId: item.id,
                filename: item.filename,
                localUri: item.localUri,
                mediaType: item.mediaType,
                creationTime: item.creationTime,
                remotePath,
              },
              (progress) => {
                setQueueState((currentQueue) =>
                  updateUploadItem(currentQueue, item.id, {
                    status: 'uploading',
                    progress: progress.fraction,
                  })
                );
              }
            );

            uploadedCount += 1;
            maxSyncedTime = Math.max(maxSyncedTime, item.creationTime);

            setQueueState((currentQueue) =>
              updateUploadItem(currentQueue, item.id, {
                status: 'completed',
                progress: 1,
                errorMessage: undefined,
                uploadedAt: Date.now(),
              })
            );
          } catch (error) {
            setQueueState((currentQueue) =>
              updateUploadItem(currentQueue, item.id, {
                status: 'failed',
                errorMessage: String(error),
              })
            );

            if (attemptCount >= maxRetryAttempts) {
              appendLog(
                'error',
                `Failed to upload ${item.filename}: ${String(error)} (retry limit reached)`
              );
            } else {
              appendLog(
                'error',
                `Failed to upload ${item.filename}: ${String(error)} (attempt ${attemptCount}/${maxRetryAttempts})`
              );
            }
          }
        }

        const nextMetadata: SyncMetadata = {
          lastSyncedAssetTime:
            maxSyncedTime > 0 ? maxSyncedTime : metadataRef.current.lastSyncedAssetTime,
          lastCompletedAt: Date.now(),
        };

        setMetadata(nextMetadata);
        await saveSyncMetadata(nextMetadata);

        applyCompletedCleanup(syncSettingsRef.current, true);

        if (uploadedCount > 0) {
          appendLog(
            'info',
            `Uploaded ${uploadedCount} item(s)${options?.trigger ? ` (${options.trigger})` : ''}.`
          );
        } else if (!options?.silent) {
          appendLog('info', 'Upload run finished without successful uploads.');
        }

        return uploadedCount;
      } finally {
        setPhase('idle');
        setCancelAfterCurrentItem(false);
      }
    },
    [appendLog, applyCompletedCleanup, scanForNewMedia, setQueueState]
  );

  const requestCancelAfterCurrentItem = useCallback(() => {
    if (phaseRef.current !== 'syncing') {
      return;
    }

    setCancelAfterCurrentItem(true);
  }, []);

  const retryFailedUploads = useCallback(() => {
    const maxRetries = syncSettingsRef.current.maxRetryAttempts;
    let retried = 0;

    setQueueState((current) =>
      current.map((item) => {
        if (item.status !== 'failed' || item.attemptCount >= maxRetries) {
          return item;
        }

        retried += 1;
        return {
          ...item,
          status: 'pending',
          progress: 0,
          errorMessage: undefined,
        };
      })
    );

    if (retried > 0) {
      appendLog('info', `Moved ${retried} failed item(s) back to pending.`);
    }
  }, [appendLog, setQueueState]);

  const clearCompletedUploads = useCallback(() => {
    setQueueState((current) => current.filter((item) => item.status !== 'completed'));
  }, [setQueueState]);

  const clearFailedUploads = useCallback(() => {
    setQueueState((current) => current.filter((item) => item.status !== 'failed'));
  }, [setQueueState]);

  const clearAllUploads = useCallback(() => {
    setQueueState(() => []);
  }, [setQueueState]);

  useEffect(() => {
    setBackgroundSyncRunner(async () => runSync({ silent: true, trigger: 'background' }));

    return () => {
      setBackgroundSyncRunner(null);
    };
  }, [runSync]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void syncBackgroundTaskRegistration(
      syncSettings.backgroundSyncEnabled,
      syncSettings.backgroundIntervalMinutes * 60
    ).catch((error) => {
      appendLog('error', `Background task registration failed: ${String(error)}`);
    });
  }, [
    appendLog,
    isReady,
    syncSettings.backgroundIntervalMinutes,
    syncSettings.backgroundSyncEnabled,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    applyCompletedCleanup(syncSettings, true);
  }, [applyCompletedCleanup, isReady, syncSettings]);

  useEffect(() => {
    if (!isReady || launchScanDoneRef.current || !syncSettings.autoScanOnLaunch) {
      return;
    }

    launchScanDoneRef.current = true;

    void runSync({ silent: true, trigger: 'launch' });
  }, [isReady, runSync, syncSettings.autoScanOnLaunch]);

  const value = useMemo<PhotoSyncContextValue>(
    () => ({
      isReady,
      phase,
      permissionState,
      smbConfig,
      smbPassword,
      syncSettings,
      metadata,
      queue,
      logs,
      uploaderImplementation: uploader.implementationName,
      cancelAfterCurrentItem,
      requestPhotoPermission,
      saveConnectionSettings,
      saveSyncSettings: saveSyncSettingsHandler,
      scanForNewMedia,
      runSync,
      requestCancelAfterCurrentItem,
      retryFailedUploads,
      clearCompletedUploads,
      clearFailedUploads,
      clearAllUploads,
    }),
    [
      cancelAfterCurrentItem,
      clearAllUploads,
      clearCompletedUploads,
      clearFailedUploads,
      isReady,
      logs,
      metadata,
      permissionState,
      phase,
      queue,
      requestCancelAfterCurrentItem,
      requestPhotoPermission,
      retryFailedUploads,
      runSync,
      saveConnectionSettings,
      saveSyncSettingsHandler,
      scanForNewMedia,
      smbConfig,
      smbPassword,
      syncSettings,
    ]
  );

  return <PhotoSyncContext.Provider value={value}>{children}</PhotoSyncContext.Provider>;
}

export function usePhotoSync(): PhotoSyncContextValue {
  const context = useContext(PhotoSyncContext);

  if (!context) {
    throw new Error('usePhotoSync must be used within PhotoSyncProvider.');
  }

  return context;
}
