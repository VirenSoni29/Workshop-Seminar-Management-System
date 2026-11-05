import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const getInitialTheme = () => document.documentElement.getAttribute('data-theme') || 'light';

export function ThemeProvider({ children }) {
   const [theme, setTheme] = useState(getInitialTheme);

   // Keep <html data-theme> and localStorage in sync
   useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      try {
         localStorage.setItem('theme', theme);
      } catch {
         /* storage blocked: ignore */
      }
   }, [theme]);

   const toggleTheme = useCallback(() => {
      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
   }, []);

   const value = useMemo(
      () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
      [theme, toggleTheme]
   );

   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
   const ctx = useContext(ThemeContext);
   if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
   return ctx;
}