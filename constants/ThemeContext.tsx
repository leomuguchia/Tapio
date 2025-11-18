// hooks/theme-context.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useRNColorScheme() as ThemeType;
  const [manualTheme, setManualTheme] = useState<ThemeType | null>(null);

  const theme = manualTheme || systemTheme || 'light';
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setManualTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
