# Quick OAuth Setup Guide for FridgeScan

Your Supabase Project: **https://xcvhnqofiazdjyxvbjwj.supabase.co**

## Step 6: Configure Authentication Settings in Supabase

### 1. Configure Basic Auth Settings

1. Go to your Supabase Dashboard: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj
2. Click **Authentication** in the left sidebar
3. Click **URL Configuration** (or **Settings** tab)
4. Configure the following:

   **Site URL:**
   ```
   http://localhost:3003
   ```

   **Redirect URLs** (add all of these):
   ```
   http://localhost:3003/auth/callback
   fridgescan://auth/callback
   https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
   ```

5. Click **Save**

## Step 7: Configure Google OAuth (Recommended)

### Part A: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. **Create/Select Project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "FridgeScan" (or select existing project)
   - Click "Create"

3. **Enable Google+ API:**
   - In the left menu, go to **APIs & Services** > **Library**
   - Search for "Google+ API"
   - Click on it and click **Enable**

4. **Configure OAuth Consent Screen:**
   - Go to **APIs & Services** > **OAuth consent screen**
   - Select **External** user type
   - Click **Create**
   - Fill in:
     - App name: `FridgeScan`
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip "Scopes" page (click **Save and Continue**)
   - Add test users if needed
   - Click **Save and Continue**

5. **Create OAuth 2.0 Client ID:**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `FridgeScan Web`

   - **Authorized JavaScript origins:**
     ```
     https://xcvhnqofiazdjyxvbjwj.supabase.co
     http://localhost:3003
     ```

   - **Authorized redirect URIs:**
     ```
     https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
     http://localhost:3003/auth/callback
     ```

   - Click **Create**

6. **Copy Your Credentials:**
   - You'll see a popup with:
     - **Client ID** (looks like: xxxxx.apps.googleusercontent.com)
     - **Client Secret** (a long random string)
   - **COPY THESE!** You'll need them for Supabase

### Part B: Configure Google OAuth in Supabase

1. Go back to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list
4. Click to expand it
5. Toggle **Enable Sign in with Google** to **ON**
6. Paste your credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
7. The **Redirect URL** should already show:
   ```
   https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
   ```
   (This is what you added to Google Console)
8. Click **Save**

### Part C: Test Google OAuth

1. Make sure your dev server is running (check http://localhost:3003)
2. You should see the login screen
3. Click "Continue with Google"
4. You should be redirected to Google sign-in
5. Select your Google account
6. Grant permissions
7. You should be redirected back to your app and logged in!

## Step 8: Configure Apple OAuth (Optional - iOS Only)

**Note:** This requires an Apple Developer account ($99/year) and is only needed for iOS apps.

### Part A: Apple Developer Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Sign in with your Apple ID (must have paid developer account)

3. **Create an App ID:**
   - Go to **Certificates, Identifiers & Profiles**
   - Click **Identifiers** > **+ (Add)**
   - Select **App IDs** > **Continue**
   - Select **App** > **Continue**
   - Fill in:
     - Description: `FridgeScan`
     - Bundle ID: `com.justarieldotcom.fridgescan` (must match app.json)
   - Scroll down and check **Sign in with Apple**
   - Click **Continue** > **Register**

4. **Create a Services ID:**
   - Click **Identifiers** > **+ (Add)**
   - Select **Services IDs** > **Continue**
   - Fill in:
     - Description: `FridgeScan Web`
     - Identifier: `com.justarieldotcom.fridgescan.web`
   - Check **Sign in with Apple**
   - Click **Configure** next to Sign in with Apple
   - Primary App ID: Select the App ID you created
   - Domains and Subdomains:
     ```
     xcvhnqofiazdjyxvbjwj.supabase.co
     ```
   - Return URLs:
     ```
     https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
     ```
   - Click **Save** > **Continue** > **Register**

5. **Create a Key for Sign in with Apple:**
   - Go to **Keys** > **+ (Add)**
   - Key Name: `FridgeScan Sign in with Apple Key`
   - Check **Sign in with Apple**
   - Click **Configure** next to it
   - Primary App ID: Select your App ID
   - Click **Save** > **Continue** > **Register**
   - **Download the key file (.p8)** - YOU CAN ONLY DO THIS ONCE!
   - Note the **Key ID** shown on the confirmation page

6. **Get Your Team ID:**
   - In the top right of Apple Developer Portal, click your name
   - Your Team ID is shown (10 characters)
   - Copy it

### Part B: Configure Apple OAuth in Supabase

1. Go to Supabase Dashboard: **Authentication** > **Providers**
2. Find **Apple** in the list
3. Click to expand it
4. Toggle **Enable Sign in with Apple** to **ON**
5. Fill in:
   - **Services ID**: `com.justarieldotcom.fridgescan.web` (from step 4)
   - **Team ID**: (10-character ID from step 6)
   - **Key ID**: (from step 5)
   - **Private Key**: Open the .p8 file you downloaded and paste the entire contents
6. Click **Save**

### Part C: Test Apple OAuth

1. This only works on iOS devices or simulators
2. Build the app for iOS (requires Mac and Xcode)
3. On the login screen, tap "Continue with Apple"
4. Follow the Apple authentication flow
5. You should be logged in!

## Troubleshooting

### Google OAuth Issues

**"redirect_uri_mismatch" Error:**
- Make sure the redirect URI in Google Console exactly matches:
  ```
  https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
  ```
- Make sure you added it to **Authorized redirect URIs** (not JavaScript origins)

**"Access blocked" Error:**
- Your OAuth consent screen might not be published
- Add yourself as a test user in Google Cloud Console
- Or publish the app (requires verification for production)

**"Invalid client" Error:**
- Double-check Client ID and Client Secret in Supabase
- Make sure there are no extra spaces when pasting

### Apple OAuth Issues

**"Invalid client" Error:**
- Verify Services ID matches exactly
- Check Team ID is correct (10 characters)
- Ensure Key ID is correct

**Private Key Error:**
- Make sure you pasted the entire .p8 file contents including:
  ```
  -----BEGIN PRIVATE KEY-----
  ...
  -----END PRIVATE KEY-----
  ```

### General Issues

**Redirect Loops:**
- Clear browser cache and cookies
- Check that Site URL is set correctly in Supabase

**"Authentication failed" Error:**
- Check Supabase logs: **Project Settings** > **API** > **Logs**
- Look for specific error messages

## Next Steps After OAuth Setup

1. **Test Email Authentication:**
   - Try signing up with email/password
   - Check that profile and household are auto-created
   - Verify you can log in and out

2. **Test Social Authentication:**
   - Try "Continue with Google"
   - Try "Continue with Apple" (iOS only)
   - Verify you're redirected back and logged in

3. **Check Database:**
   - Go to Supabase **Table Editor**
   - Check `profiles` table - should have your user
   - Check `households` table - should have auto-created household
   - Check `household_members` table - should link you to household

4. **Configure Production:**
   - When ready for production, update redirect URLs
   - Add your production domain to both OAuth providers
   - Update Site URL in Supabase to your production domain

## Summary Checklist

- [ ] Step 6: Basic Auth Settings configured in Supabase
  - [ ] Site URL set to `http://localhost:3003`
  - [ ] Redirect URLs added
- [ ] Step 7: Google OAuth configured
  - [ ] Google Cloud Console project created
  - [ ] OAuth consent screen configured
  - [ ] Client ID and Secret created
  - [ ] Credentials added to Supabase
  - [ ] Tested Google sign-in
- [ ] Step 8: Apple OAuth configured (optional)
  - [ ] App ID created
  - [ ] Services ID created
  - [ ] Key created and downloaded
  - [ ] Credentials added to Supabase
  - [ ] Tested Apple sign-in (iOS)

## Quick Test

Once everything is configured:

1. Open http://localhost:3003
2. You should see the login screen
3. Try each authentication method:
   - Email signup ✓
   - Email login ✓
   - Google OAuth ✓
   - Apple OAuth ✓ (iOS only)
4. Check that you're redirected to the main app
5. Check profile in Supabase dashboard

You're done! 🎉
