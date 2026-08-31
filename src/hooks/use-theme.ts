// src/hooks/use-theme.ts
import { useContext } from 'react';
// ✅ Now ThemeContext will be found
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};