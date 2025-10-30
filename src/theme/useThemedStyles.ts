import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { ColorPalette } from './colors';

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  stylesFn: (colors: ColorPalette) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => stylesFn(colors), [colors]);
}
