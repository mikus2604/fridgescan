import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isConfigured } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    // Check if user is not configured
    if (!isConfigured) {
      // If not configured, still allow access but login screen will show error
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User is not signed in and not on an auth page, redirect to login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // User is signed in and on an auth page, redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, isConfigured]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
