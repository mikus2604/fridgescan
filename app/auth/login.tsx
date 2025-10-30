import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, isConfigured } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      // Navigation will be handled by auth state change
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError('');

    const { error } = await signInWithApple();

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Supabase Not Configured
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Please set up your Supabase project credentials in the .env file.
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: 16 }]}>
            Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
          </Text>
        </View>
      </View>
    );
  }

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    subtitle: { color: colors.textSecondary },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
    button: { backgroundColor: colors.primary },
    buttonText: { color: '#FFFFFF' },
    socialButton: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    socialButtonText: { color: colors.text },
    linkText: { color: colors.primary },
    errorText: { color: colors.error },
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, dynamicStyles.container]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, dynamicStyles.title]}>Welcome Back</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Sign in to your FridgeScan account
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={[styles.errorBannerText, dynamicStyles.errorText]}>
                {error}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />

            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={handleEmailLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, dynamicStyles.socialButton]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={[styles.socialButtonText, dynamicStyles.socialButtonText]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, dynamicStyles.socialButton]}
                onPress={handleAppleLogin}
                disabled={isLoading}
              >
                <Text style={[styles.socialButtonText, dynamicStyles.socialButtonText]}>
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={[styles.linkText, dynamicStyles.linkText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialButton: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
