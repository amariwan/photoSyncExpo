import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PhotoSyncProvider } from '@/providers/photo-sync-provider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <PhotoSyncProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[theme].tint,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Sync',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.triangle.2.circlepath" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="slider.horizontal.3" color={color} />,
          }}
        />
      </Tabs>
    </PhotoSyncProvider>
  );
}
