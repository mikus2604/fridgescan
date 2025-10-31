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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/theme/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isConfigured } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
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
    linkText: { color: colors.primary },
    errorText: { color: colors.error },
    successText: { color: colors.success },
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, dynamicStyles.container]}
      >
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={[styles.successTitle, dynamicStyles.title]}>
              Check Your Email
            </Text>
            <Text style={[styles.successMessage, dynamicStyles.subtitle]}>
              We've sent a password reset link to {email}. Please check your inbox and follow the
              instructions to reset your password.
            </Text>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.button, { marginTop: 24 }]}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
          <Text style={[styles.title, dynamicStyles.title]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Enter your email address and we'll send you a link to reset your password
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

            <TouchableOpacity
              style={[styles.button, dynamicStyles.button]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Remember your password?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={[styles.linkText, dynamicStyles.linkText]}>Sign In</Text>
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
    lineHeight: 24,
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
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: '#10B981',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
