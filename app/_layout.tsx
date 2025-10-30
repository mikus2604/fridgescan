import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useInventoryStore } from '../src/store/inventoryStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';

function RootLayoutContent() {
  const loadData = useInventoryStore((state) => state.loadData);
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <StatusBar style={colors.statusBarStyle} />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
