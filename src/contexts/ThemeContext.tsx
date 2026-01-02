import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';
type TextSize = 'small' | 'medium' | 'large' | 'xl';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  textSize: TextSize;
  setTheme: (theme: Theme) => void;
  setTextSize: (size: TextSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'auto';
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    const saved = localStorage.getItem('textSize');
    return (saved as TextSize) || 'medium';
  });

  const [systemPreference, setSystemPreference] = useState<ResolvedTheme>('dark');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return systemPreference;
    }
    return theme;
  }, [theme, systemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Apply text size to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-text-size', textSize);
  }, [textSize]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const setTextSize = useCallback((newSize: TextSize) => {
    setTextSizeState(newSize);
    localStorage.setItem('textSize', newSize);
  }, []);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    textSize,
    setTheme,
    setTextSize,
  }), [theme, resolvedTheme, textSize, setTheme, setTextSize]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
