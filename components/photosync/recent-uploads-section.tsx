import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { RecentUploadItemCard } from './recent-upload-item-card';
import { selectRecentQueueItems } from './sync-screen-selectors';
import { SyncSectionHeader } from './sync-section-header';
import { syncSectionStyles } from './sync-section.styles';

export function RecentUploadsSection() {
  const { queue, syncSettings } = usePhotoSync();
  const visibleQueue = useMemo(() => selectRecentQueueItems(queue, 14), [queue]);
  const caption = visibleQueue.length > 0
    ? `Newest ${visibleQueue.length} item(s)`
    : 'Newest first, limited preview';

  return (
    <View style={syncSectionStyles.card}>
      <SyncSectionHeader caption={caption} title="Recent Upload Items" />
      {visibleQueue.length === 0 ? (
        <Text style={syncSectionStyles.empty}>No items queued yet.</Text>
      ) : (
        visibleQueue.map((item) => (
          <RecentUploadItemCard item={item} key={item.id} maxRetryAttempts={syncSettings.maxRetryAttempts} />
        ))
      )}
    </View>
  );
}
