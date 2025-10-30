import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    // Wait for auth state to update
    if (!isLoading) {
      if (session) {
        // Successfully authenticated, redirect to main app
        router.replace('/(tabs)');
      } else {
        // Authentication failed, redirect back to login
        router.replace('/auth/login');
      }
    }
  }, [session, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text, marginTop: 16 }]}>
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});
