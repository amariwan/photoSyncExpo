import type { SyncLogEntry, UploadItem } from '@/types/photosync';

export interface QueueStats {
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
  retryExhausted: number;
}

export function computeQueueStats(queue: UploadItem[], maxRetryAttempts: number): QueueStats {
  const pending = queue.filter((item) => item.status === 'pending').length;
  const uploading = queue.filter((item) => item.status === 'uploading').length;
  const completed = queue.filter((item) => item.status === 'completed').length;
  const failed = queue.filter((item) => item.status === 'failed').length;
  const retryExhausted = queue.filter(
    (item) => item.status === 'failed' && item.attemptCount >= maxRetryAttempts
  ).length;

  return { pending, uploading, completed, failed, retryExhausted };
}

export function selectRecentQueueItems(queue: UploadItem[], limit: number): UploadItem[] {
  return [...queue].sort((a, b) => b.creationTime - a.creationTime).slice(0, limit);
}

export function selectRecentLogs(logs: SyncLogEntry[], limit: number): SyncLogEntry[] {
  return logs.slice(0, limit);
}
