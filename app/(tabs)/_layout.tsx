import { Tabs } from 'expo-router';
import React from 'react';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PhotoSyncProvider } from '@/providers/photo-sync-provider';

export default function TabLayout() {
  return (
    <PhotoSyncProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(235, 235, 245, 0.3)',
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(22, 22, 22, 0.92)',
            borderTopColor: 'rgba(84, 84, 88, 0.35)',
            borderTopWidth: 0.5,
            height: 88,
            paddingTop: 8,
            paddingBottom: 20,
          },
          tabBarItemStyle: {
            borderRadius: 0,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            letterSpacing: 0.1,
          },
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Sync',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="arrow.triangle.2.circlepath" color={color} />,
          }}
        />
        <Tabs.Screen
          name="gallery"
          options={{
            title: 'Photos',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="photo.on.rectangle.angled" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="files"
          options={{
            title: 'Files',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="folder.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="slider.horizontal.3" color={color} />,
          }}
        />
      </Tabs>
    </PhotoSyncProvider>
  );
}
