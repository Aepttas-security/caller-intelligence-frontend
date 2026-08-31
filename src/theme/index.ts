export const colors = {
  // Primary Colors
  primary: '#4a6cf7',
  primaryDark: '#3651d4',
  primaryLight: '#6b8af8',
  
  // Secondary Colors
  secondary: '#7c3aed',
  secondaryDark: '#6d28d9',
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  critical: '#dc2626',
  
  // Background Colors
  background: '#0a0a1a',
  backgroundLight: '#1a1a2e',
  backgroundCard: 'rgba(26, 26, 46, 0.8)',
  
  // Text Colors
  text: '#ffffff',
  textSecondary: '#8a8a8a',
  textMuted: '#6b7280',
  
  // Border Colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '600' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
};

export const shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const glassmorphism = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(20px)',
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
};