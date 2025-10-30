export type Theme = 'light' | 'dark';

export interface ColorPalette {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface colors (cards, modals, etc.)
  surface: string;
  surfaceSecondary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border colors
  border: string;
  borderSecondary: string;

  // Primary brand color (green)
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors (these remain consistent for expiry indicators)
  statusExpired: string;
  statusCritical: string;
  statusWarning: string;
  statusCaution: string;
  statusFresh: string;

  // Semantic colors
  success: string;
  successBackground: string;
  error: string;
  errorBackground: string;
  warning: string;
  warningBackground: string;
  info: string;
  infoBackground: string;

  // Interactive elements
  buttonBackground: string;
  buttonText: string;
  buttonSecondaryBackground: string;
  buttonSecondaryText: string;

  // Input fields
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Status bar
  statusBarStyle: 'light' | 'dark' | 'auto';

  // Additional semantic colors
  white: string;
  danger: string;
}

export const lightColors: ColorPalette = {
  // Backgrounds
  background: '#F9FAFB',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F3F4F6',

  // Surfaces
  surface: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderSecondary: '#D1D5DB',

  // Primary
  primary: '#10B981',
  primaryLight: '#D1FAE5',
  primaryDark: '#065F46',

  // Status colors (consistent across themes)
  statusExpired: '#991B1B',
  statusCritical: '#EF4444',
  statusWarning: '#F59E0B',
  statusCaution: '#EAB308',
  statusFresh: '#10B981',

  // Semantic
  success: '#10B981',
  successBackground: '#D1FAE5',
  error: '#EF4444',
  errorBackground: '#FEE2E2',
  warning: '#F59E0B',
  warningBackground: '#FEF3C7',
  info: '#3B82F6',
  infoBackground: '#DBEAFE',

  // Interactive
  buttonBackground: '#F3F4F6',
  buttonText: '#4B5563',
  buttonSecondaryBackground: '#FFFFFF',
  buttonSecondaryText: '#374151',

  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputText: '#111827',
  inputPlaceholder: '#9CA3AF',

  // Status bar
  statusBarStyle: 'dark',

  // Additional
  white: '#FFFFFF',
  danger: '#EF4444',
};

export const darkColors: ColorPalette = {
  // Backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',

  // Surfaces
  surface: '#1E293B',
  surfaceSecondary: '#0F172A',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  // Borders
  border: '#334155',
  borderSecondary: '#475569',

  // Primary
  primary: '#10B981',
  primaryLight: '#065F46',
  primaryDark: '#D1FAE5',

  // Status colors (consistent across themes)
  statusExpired: '#991B1B',
  statusCritical: '#EF4444',
  statusWarning: '#F59E0B',
  statusCaution: '#EAB308',
  statusFresh: '#10B981',

  // Semantic
  success: '#10B981',
  successBackground: '#064E3B',
  error: '#EF4444',
  errorBackground: '#7F1D1D',
  warning: '#F59E0B',
  warningBackground: '#78350F',
  info: '#3B82F6',
  infoBackground: '#1E3A8A',

  // Interactive
  buttonBackground: '#334155',
  buttonText: '#F1F5F9',
  buttonSecondaryBackground: '#1E293B',
  buttonSecondaryText: '#CBD5E1',

  // Input
  inputBackground: '#1E293B',
  inputBorder: '#475569',
  inputText: '#F1F5F9',
  inputPlaceholder: '#64748B',

  // Status bar
  statusBarStyle: 'light',

  // Additional
  white: '#FFFFFF',
  danger: '#EF4444',
};

export const getThemeColors = (theme: Theme): ColorPalette => {
  return theme === 'dark' ? darkColors : lightColors;
};
