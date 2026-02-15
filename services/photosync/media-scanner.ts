import * as MediaLibrary from 'expo-media-library';

import type { PermissionState } from '@/types/photosync';

export interface ScannedMediaItem {
  id: string;
  filename: string;
  localUri: string;
  mediaType: 'photo' | 'video';
  creationTime: number;
}

export interface ScanMediaFilter {
  uploadPhotos: boolean;
  uploadVideos: boolean;
}

export async function getMediaPermissionState(): Promise<PermissionState> {
  const permission = await MediaLibrary.getPermissionsAsync();

  if (permission.granted) {
    return 'granted';
  }

  if (permission.canAskAgain) {
    return 'unknown';
  }

  return 'denied';
}

export async function requestMediaPermission(): Promise<PermissionState> {
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (permission.granted) {
    return 'granted';
  }

  if (permission.canAskAgain) {
    return 'unknown';
  }

  return 'denied';
}

function toSupportedMediaType(mediaType: MediaLibrary.MediaTypeValue): 'photo' | 'video' | null {
  if (mediaType === 'photo') {
    return 'photo';
  }
  if (mediaType === 'video') {
    return 'video';
  }

  return null;
}

export async function scanNewCameraRollMedia(
  lastSyncedAssetTime: number | null,
  maxItems: number,
  filter: ScanMediaFilter
): Promise<ScannedMediaItem[]> {
  if (!filter.uploadPhotos && !filter.uploadVideos) {
    return [];
  }

  const requestedMediaTypes: MediaLibrary.MediaTypeValue[] = [];
  if (filter.uploadPhotos) {
    requestedMediaTypes.push(MediaLibrary.MediaType.photo);
  }
  if (filter.uploadVideos) {
    requestedMediaTypes.push(MediaLibrary.MediaType.video);
  }

  const results: ScannedMediaItem[] = [];

  let after: string | undefined;
  const createdAfter =
    typeof lastSyncedAssetTime === 'number' ? lastSyncedAssetTime + 1 : undefined;

  while (results.length < maxItems) {
    const page = await MediaLibrary.getAssetsAsync({
      first: Math.min(100, maxItems - results.length),
      after,
      mediaType: requestedMediaTypes,
      sortBy: [[MediaLibrary.SortBy.creationTime, true]],
      createdAfter,
    });

    if (page.assets.length === 0) {
      break;
    }

    for (const asset of page.assets) {
      if (typeof lastSyncedAssetTime === 'number' && asset.creationTime <= lastSyncedAssetTime) {
        continue;
      }

      const normalizedType = toSupportedMediaType(asset.mediaType);
      if (!normalizedType) {
        continue;
      }

      const info = await MediaLibrary.getAssetInfoAsync(asset.id, {
        shouldDownloadFromNetwork: true,
      });

      const localUri = info.localUri ?? asset.uri;
      if (!localUri) {
        continue;
      }

      results.push({
        id: asset.id,
        filename: asset.filename,
        localUri,
        mediaType: normalizedType,
        creationTime: asset.creationTime,
      });

      if (results.length >= maxItems) {
        break;
      }
    }

    if (!page.hasNextPage) {
      break;
    }

    after = page.endCursor;
  }

  return results;
}
