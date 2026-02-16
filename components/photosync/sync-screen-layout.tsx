import { FailedUploadsPanel } from '@/components/photosync/failed-uploads-panel';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Reveal } from '@/components/ui/reveal';

import { QueueSummarySection } from './queue-summary-section';
import { RecentActivitySection } from './recent-activity-section';
import { RecentUploadsSection } from './recent-uploads-section';
import { SyncActionsSection } from './sync-actions-section';
import { SyncHeroSection } from './sync-hero-section';
import { SyncScreenBackground } from './sync-screen-background';
import { syncScreenLayoutStyles as styles } from './sync-screen-layout.styles';

export function SyncScreenLayout() {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <SyncScreenBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal delay={20}><SyncHeroSection /></Reveal>
        <Reveal delay={80}><SyncActionsSection /></Reveal>
        <Reveal delay={140}><QueueSummarySection /></Reveal>
        <Reveal delay={200}><FailedUploadsPanel /></Reveal>
        <Reveal delay={230}><RecentUploadsSection /></Reveal>
        <Reveal delay={260}><RecentActivitySection /></Reveal>
      </ScrollView>
    </SafeAreaView>
  );
}
