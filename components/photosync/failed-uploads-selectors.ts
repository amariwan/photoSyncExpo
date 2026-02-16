import type { UploadItem } from '@/types/photosync';

export function selectRecentFailedUploads(queue: UploadItem[], limit: number): UploadItem[] {
  return queue
    .filter((item) => item.status === 'failed')
    .sort((a, b) => failureTime(b) - failureTime(a))
    .slice(0, limit);
}

function failureTime(item: UploadItem): number {
  return item.lastAttemptAt ?? item.creationTime;
}
