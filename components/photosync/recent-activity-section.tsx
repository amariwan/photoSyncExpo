import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { usePhotoSync } from '@/providers/photo-sync-provider';

import { RecentActivityItem } from './recent-activity-item';
import { selectRecentLogs } from './sync-screen-selectors';
import { SyncSectionHeader } from './sync-section-header';
import { syncSectionStyles } from './sync-section.styles';

export function RecentActivitySection() {
  const { logs } = usePhotoSync();
  const visibleLogs = useMemo(() => selectRecentLogs(logs, 12), [logs]);
  const caption = visibleLogs.length > 0
    ? `${visibleLogs.length} latest event(s)`
    : 'Operational events and errors';

  return (
    <View style={syncSectionStyles.card}>
      <SyncSectionHeader caption={caption} title="Recent Activity" />
      {visibleLogs.length === 0 ? (
        <Text style={syncSectionStyles.empty}>No activity yet.</Text>
      ) : (
        visibleLogs.map((entry) => <RecentActivityItem entry={entry} key={entry.id} />)
      )}
    </View>
  );
}
