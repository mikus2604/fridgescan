# Supabase Authentication Setup Guide

This guide walks you through setting up Supabase authentication for FridgeScan with email, Google, and Apple Sign In.

## Table of Contents
1. [Create Supabase Project](#1-create-supabase-project)
2. [Run Database Migration](#2-run-database-migration)
3. [Configure Email Authentication](#3-configure-email-authentication)
4. [Configure Google OAuth](#4-configure-google-oauth)
5. [Configure Apple Sign In](#5-configure-apple-sign-in)
6. [Set Up Environment Variables](#6-set-up-environment-variables)
7. [Configure OAuth Redirects](#7-configure-oauth-redirects)
8. [Test the Implementation](#8-test-the-implementation)
9. [Troubleshooting](#troubleshooting)

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: FridgeScan (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development
4. Click **"Create new project"**
5. Wait 1-2 minutes for project to be provisioned

## 2. Run Database Migration

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open `docs/supabase_migration.sql` from this repository
4. Copy the entire SQL script
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. Verify success: You should see "Success. No rows returned" message
8. Navigate to **"Table Editor"** to confirm tables were created:
   - profiles
   - households
   - household_members
   - household_invites
   - storage_locations
   - products
   - inventory_items
   - usage_history

## 3. Configure Email Authentication

Email authentication is enabled by default in Supabase.

### Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates** in Supabase dashboard
2. Customize the following templates:
   - **Confirm Signup**: Email sent when user registers
   - **Invite User**: Email for inviting users
   - **Magic Link**: For passwordless login (optional)
   - **Reset Password**: Password reset email

### Email Settings

1. Go to **Authentication** → **Settings** → **Email**
2. Configure:
   - **Enable Email Confirmations**: Toggle based on your needs
     - ON: Users must verify email before accessing app (recommended for production)
     - OFF: Users can access immediately (easier for development)
   - **Enable Email Change**: Allow users to change their email
   - **Secure Email Change**: Require confirmation for email changes

### SMTP Configuration (Optional - For Production)

By default, Supabase uses its email service (limited to 4 emails/hour in free tier).

For production, configure custom SMTP:
1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP credentials (e.g., SendGrid, Amazon SES, Postmark)

## 4. Configure Google OAuth

### Step A: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**
4. Configure OAuth consent screen:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** (unless you have Google Workspace)
   - Fill in app information:
     - App name: FridgeScan
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid` (should be pre-selected)
   - Add test users if not published
   - Click **Save and Continue**
5. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
   - Select **Web application**
   - Name: FridgeScan Web Client
   - Add **Authorized redirect URIs**:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
     (Find your project ref in Supabase Project Settings → API)
   - Click **Create**
   - **Save the Client ID and Client Secret**

### Step B: Add Google OAuth to Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google**
4. Enter:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click **Save**

### Step C: Configure for Mobile (iOS & Android)

#### iOS Configuration
1. In Google Cloud Console, create additional OAuth client:
   - Type: **iOS**
   - Bundle ID: `com.yourcompany.fridgescan` (must match app.json)
2. Add URL schemes to `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.fridgescan",
         "config": {
           "googleSignIn": {
             "reservedClientId": "YOUR_IOS_CLIENT_ID"
           }
         }
       }
     }
   }
   ```

#### Android Configuration
1. In Google Cloud Console, create additional OAuth client:
   - Type: **Android**
   - Package name: `com.yourcompany.fridgescan`
   - SHA-1 certificate: Get from `expo fetch:android:hashes`
2. Add to `app.json`:
   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.fridgescan"
       }
     }
   }
   ```

## 5. Configure Apple Sign In

### Step A: Apple Developer Setup

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create App ID:
   - Click **Identifiers** → **+** button
   - Select **App IDs** → Continue
   - Description: FridgeScan
   - Bundle ID: `com.yourcompany.fridgescan` (explicit, not wildcard)
   - Capabilities: Check **Sign In with Apple**
   - Click **Continue** → **Register**

4. Create Service ID:
   - Click **Identifiers** → **+** button
   - Select **Services IDs** → Continue
   - Description: FridgeScan Web
   - Identifier: `com.yourcompany.fridgescan.web`
   - Check **Sign In with Apple**
   - Click **Configure** next to Sign In with Apple:
     - Primary App ID: Select your App ID from step 3
     - Domains: `[YOUR-PROJECT-REF].supabase.co`
     - Return URLs: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
   - Click **Save** → **Continue** → **Register**

5. Create Private Key:
   - Click **Keys** → **+** button
   - Key Name: FridgeScan Sign In with Apple Key
   - Check **Sign In with Apple**
   - Click **Configure** → Select your primary App ID
   - Click **Save** → **Continue** → **Register**
   - **Download the .p8 key file** (you can only download once!)
   - Note the **Key ID** shown

### Step B: Add Apple OAuth to Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Apple** and click to expand
3. Toggle **Enable Sign in with Apple**
4. Enter:
   - **Services ID**: `com.yourcompany.fridgescan.web` (from Step A.4)
   - **Team ID**: Find in Apple Developer Account → Membership
   - **Key ID**: From the key you created (Step A.5)
   - **Private Key**: Open the .p8 file in text editor and paste contents
5. Click **Save**

### Step C: Configure for iOS

Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    }
  }
}
```

For iOS native builds, Apple Sign In requires additional configuration in EAS Build.

## 6. Set Up Environment Variables

1. In your Supabase project dashboard, go to **Project Settings** → **API**
2. Find these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Long string starting with `eyJ...`

3. Create `.env` file in project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your Supabase credentials:
   ```env
   # Supabase Authentication
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
   ```

5. **Important**: Never commit `.env` to version control. It's already in `.gitignore`.

## 7. Configure OAuth Redirects

### For Web Development (localhost)

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3003/auth/callback
   http://localhost:3003
   ```

### For Production Web

1. Add your production URLs:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com
   ```

### For Mobile Development

1. Add deep link URLs:
   ```
   fridgescan://auth/callback
   com.yourcompany.fridgescan://auth/callback
   ```

2. Configure in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "fridgescan",
       "slug": "fridgescan"
     }
   }
   ```

## 8. Test the Implementation

### Test Email Registration

1. Start your development server:
   ```bash
   npm run web  # or npm start for full Expo
   ```

2. Navigate to `http://localhost:3003/auth/register`
3. Fill in the registration form
4. Submit
5. Check Supabase Dashboard → **Authentication** → **Users** to see new user
6. If email confirmation is enabled, check email for verification link

### Test Google OAuth

1. Navigate to `http://localhost:3003/auth/login`
2. Click **"Continue with Google"**
3. Select Google account
4. Authorize the app
5. You should be redirected back and logged in
6. Check Supabase Dashboard → **Authentication** → **Users**

### Test Apple Sign In (iOS only)

1. Build iOS app or test on iOS simulator
2. Navigate to login screen
3. Click **"Continue with Apple"**
4. Follow Apple authentication flow
5. Check Supabase Dashboard for new user

### Verify Database Triggers

After registering a new user:

1. Go to Supabase **Table Editor**
2. Check **profiles** table → Should have new row
3. Check **households** table → Should have "My Household" created
4. Check **household_members** table → User should be owner
5. Check **storage_locations** table → Should have 3 default locations

## Troubleshooting

### Email Authentication Issues

**Problem**: Not receiving confirmation emails

**Solutions**:
- Check Supabase email quota (4/hour on free tier)
- Verify SMTP settings if using custom SMTP
- Check spam folder
- For development, disable email confirmation in Auth settings

### Google OAuth Issues

**Problem**: "redirect_uri_mismatch" error

**Solutions**:
- Verify redirect URI in Google Cloud Console matches exactly
- Format: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Check for trailing slashes
- Wait a few minutes for changes to propagate

**Problem**: "Access blocked: This app's request is invalid"

**Solutions**:
- Ensure OAuth consent screen is configured
- Add test users if app is in testing mode
- Verify scopes include email, profile, openid

### Apple Sign In Issues

**Problem**: "invalid_client" error

**Solutions**:
- Verify Service ID matches exactly
- Check Team ID is correct
- Ensure private key (.p8) is pasted correctly with no extra spaces
- Verify Return URLs match in both Apple Developer Portal and Supabase

**Problem**: Not working on web

**Solutions**:
- Apple Sign In requires HTTPS in production
- For localhost, use: `https://localhost:3003` with self-signed cert
- Or test on deployed version

### Database Issues

**Problem**: RLS policies blocking access

**Solutions**:
- Check user is authenticated: `SELECT auth.uid()` should return user ID
- Verify user is member of household
- Check RLS policies in SQL Editor
- Temporarily disable RLS for debugging: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

**Problem**: Triggers not firing

**Solutions**:
- Verify triggers exist: `SELECT * FROM pg_trigger;`
- Check trigger functions: `SELECT * FROM pg_proc WHERE proname LIKE 'handle_%';`
- Re-run migration SQL if needed

### General Debugging

1. **Check Supabase Logs**:
   - Dashboard → **Logs** → **Auth Logs**
   - Look for error messages

2. **Check Browser Console**:
   - Open DevTools → Console
   - Look for Supabase errors

3. **Test API Connection**:
   ```typescript
   const { data, error } = await supabase.auth.getSession()
   console.log('Session:', data)
   console.log('Error:', error)
   ```

4. **Verify Environment Variables**:
   ```bash
   echo $EXPO_PUBLIC_SUPABASE_URL
   ```
   Should not be empty or the example value

## Next Steps

Once authentication is working:

1. **Implement Protected Routes**: Redirect unauthenticated users to login
2. **Add Profile Management**: Allow users to update name, avatar
3. **Build Household Invitations**: Implement invite code generation and joining
4. **Test Household Sharing**: Verify RLS policies work correctly
5. **Add Push Notifications**: Firebase Cloud Messaging for expiry alerts
6. **Deploy to Production**: Set up production OAuth credentials and deploy

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Supabase logs and browser console
3. Consult Supabase Discord community
4. Open an issue in the project repository
