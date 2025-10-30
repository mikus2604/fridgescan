import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Database } from '../types/database.types';

// Conditionally import WebBrowser only for native platforms
let WebBrowser: any = null;
let Linking: any = null;
let makeRedirectUri: any = null;

if (Platform.OS !== 'web') {
  WebBrowser = require('expo-web-browser');
  Linking = require('expo-linking');
  const authSession = require('expo-auth-session');
  makeRedirectUri = authSession.makeRedirectUri;

  // Initialize WebBrowser for OAuth
  WebBrowser?.maybeCompleteAuthSession();
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  households: (Household & { role: HouseholdMember['role'] })[];
  currentHousehold: (Household & { role: HouseholdMember['role'] }) | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithApple: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  setCurrentHousehold: (household: Household & { role: HouseholdMember['role'] }) => void;
  refreshHouseholds: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [households, setHouseholds] = useState<(Household & { role: HouseholdMember['role'] })[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<(Household & { role: HouseholdMember['role'] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured] = useState(isSupabaseConfigured());

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch user households
  const fetchHouseholds = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          role,
          households (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const householdsData = data
        .filter((item: any) => item.households)
        .map((item: any) => ({
          ...item.households,
          role: item.role,
        }));

      setHouseholds(householdsData);

      // Set first household as current if none selected
      if (householdsData.length > 0 && !currentHousehold) {
        setCurrentHousehold(householdsData[0]);
      }
    } catch (error) {
      console.error('Error fetching households:', error);
    }
  };

  const refreshHouseholds = async () => {
    if (user) {
      await fetchHouseholds(user.id);
    }
  };

  // Initialize session
  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchHouseholds(session.user.id);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchHouseholds(session.user.id);
      } else {
        setProfile(null);
        setHouseholds([]);
        setCurrentHousehold(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        // On web, use standard OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return { error };
      } else {
        // On native platforms, use WebBrowser with fixed redirect URL
        // Using native: true ensures we get fridgescan:// instead of exp+fridgescan://
        const redirectUrl = makeRedirectUri({
          scheme: 'fridgescan',
          path: 'auth/callback',
          native: 'fridgescan://auth/callback',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) return { error };

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success' && result.url) {
            // Extract the session from the URL
            const url = new URL(result.url);
            const access_token = url.searchParams.get('access_token');
            const refresh_token = url.searchParams.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
            }
          }
        }

        return { error: null };
      }
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const signInWithApple = async () => {
    try {
      if (Platform.OS === 'web') {
        // On web, use standard OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return { error };
      } else {
        // On native platforms, use WebBrowser with fixed redirect URL
        // Using native: true ensures we get fridgescan:// instead of exp+fridgescan://
        const redirectUrl = makeRedirectUri({
          scheme: 'fridgescan',
          path: 'auth/callback',
          native: 'fridgescan://auth/callback',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });

        if (error) return { error };

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type === 'success' && result.url) {
            // Extract the session from the URL
            const url = new URL(result.url);
            const access_token = url.searchParams.get('access_token');
            const refresh_token = url.searchParams.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
            }
          }
        }

        return { error: null };
      }
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setHouseholds([]);
    setCurrentHousehold(null);
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    households,
    currentHousehold,
    isLoading,
    isConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    setCurrentHousehold,
    refreshHouseholds,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
