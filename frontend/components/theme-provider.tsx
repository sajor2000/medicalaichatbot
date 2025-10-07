'use client';

import { useEffect } from 'react';

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Always set dark mode
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  return <>{children}</>;
}
