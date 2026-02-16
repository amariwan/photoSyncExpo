import { Tabs } from 'expo-router';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PhotoSyncProvider } from '@/providers/photo-sync-provider';

const TAB_BAR_BORDER_COLOR = 'rgba(84, 84, 88, 0.35)';
const TAB_BAR_FALLBACK_BACKGROUND = 'rgba(22, 22, 22, 0.92)';

export default function TabLayout() {
  const supportsLiquidGlass =
    Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();

  return (
    <PhotoSyncProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(235, 235, 245, 0.3)',
          tabBarStyle: styles.tabBar,
          tabBarBackground: () =>
            supportsLiquidGlass ? (
              <View style={styles.tabBarBackground}>
                <GlassView glassEffectStyle="regular" style={styles.tabBarGlass} tintColor="rgba(22, 22, 22, 0.35)" />
                <View pointerEvents="none" style={styles.tabBarBorder} />
              </View>
            ) : (
              <View style={styles.tabBarFallbackBackground} />
            ),
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 88,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tabBarGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TAB_BAR_BORDER_COLOR,
  },
  tabBarFallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TAB_BAR_FALLBACK_BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TAB_BAR_BORDER_COLOR,
  },
});
