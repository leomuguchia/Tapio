import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [manualTheme, setManualTheme] = useState<'light' | 'dark' | null>(null);

  const toggleTheme = () => {
    const current = manualTheme || systemColorScheme || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    setManualTheme(newTheme);
  };

  const currentTheme = manualTheme || systemColorScheme || 'light';

  return {
    theme: currentTheme,
    toggleTheme,
    isDark: currentTheme === 'dark',
  };
}