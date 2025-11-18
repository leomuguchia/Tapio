import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/constants/ThemeContext';

export default function TabLayout() {
  const { theme, toggleTheme, isDark } = useThemeContext();
  const currentTheme = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentTheme.tint,
        tabBarInactiveTintColor: currentTheme.text + '60',
        tabBarStyle: { backgroundColor: currentTheme.background },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="theme"
        options={{
          title: 'Theme',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name={isDark ? 'sun.max.fill' : 'moon.fill'} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            toggleTheme();
          },
        }}
      />
    </Tabs>
  );
}
