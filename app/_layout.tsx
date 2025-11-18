// app/_layout.tsx
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { ThemeProvider, useThemeContext } from '@/constants/ThemeContext';
import { View, StyleSheet, StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useEffect } from 'react';

export const unstable_settings = { anchor: '(tabs)' };

function InnerLayout() {
  const { theme } = useThemeContext();
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(theme === 'dark' ? '#151718' : '#E0F2F1');
  }, [theme]);

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme === 'dark' ? '#151718' : '#E0F2F1' },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
