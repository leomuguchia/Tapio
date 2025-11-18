import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [manualTheme, setManualTheme] = useState<'light' | 'dark' | null>(null);
  const systemColorScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = manualTheme || systemColorScheme || 'light';

  const toggleColorScheme = () => {
    setManualTheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  if (!hasHydrated) {
    return {
      colorScheme: 'light' as const,
      toggleColorScheme: () => {},
    };
  }

  return {
    colorScheme,
    toggleColorScheme,
  };
}