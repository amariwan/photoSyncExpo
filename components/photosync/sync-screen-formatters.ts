export function formatTimestamp(value: number | null): string {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

export function formatProgressPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function mediaFilterLabel(uploadPhotos: boolean, uploadVideos: boolean): string {
  if (uploadPhotos && uploadVideos) {
    return 'Photos + Videos';
  }
  if (uploadPhotos) {
    return 'Photos only';
  }
  if (uploadVideos) {
    return 'Videos only';
  }

  return 'Disabled';
}
