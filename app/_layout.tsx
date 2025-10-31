import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useInventoryStore } from '../src/store/inventoryStore';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ProtectedRoute } from '../src/components/ProtectedRoute';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <RootLayoutContent />
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}

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
        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
