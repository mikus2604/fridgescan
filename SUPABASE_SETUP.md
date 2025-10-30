# Supabase Setup Guide for FridgeScan

This guide will walk you through setting up Supabase authentication and database for the FridgeScan app.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- The FridgeScan project cloned locally
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Project Name**: FridgeScan
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to finish setting up (takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. Once your project is created, go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon/public key**: A long JWT token
4. Copy these values

## Step 3: Configure Environment Variables

1. In your FridgeScan project root, the `.env` file should already exist
2. Update the following values in `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 2.

## Step 4: Run the Database Migration

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase/migrations/20250101000000_initial_schema.sql` in your project
5. Copy the entire contents
6. Paste it into the SQL Editor in Supabase
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. You should see "Success. No rows returned" - this is correct!

## Step 5: Verify Database Tables

1. Go to **Table Editor** in the Supabase sidebar
2. You should see the following tables:
   - `profiles`
   - `households`
   - `household_members`
   - `storage_locations`
   - `products`
   - `inventory_items`
   - `usage_history`

## Step 6: Configure Authentication Settings

### Basic Auth Settings

1. Go to **Authentication** > **Settings** in the Supabase sidebar
2. Under **Site URL**, add your app URL:
   - For development: `http://localhost:3003`
   - For production: Your actual domain
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3003/auth/callback
   fridgescan://auth/callback
   ```
   (Add your production domain too when ready)

### Email Auth (Already Enabled by Default)

Email authentication should already be enabled. Users can sign up with:
- Email and password
- Email confirmation (optional - you can disable in Auth settings if needed for development)

## Step 7: Configure OAuth Providers (Optional but Recommended)

### Google OAuth Setup

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Toggle **Enable Sign in with Google** to ON
4. You'll need to create a Google OAuth app:

#### Create Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. For **Application type**, select **Web application**
7. Add **Authorized JavaScript origins**:
   ```
   https://your-project-id.supabase.co
   ```
8. Add **Authorized redirect URIs**:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

#### Configure in Supabase:

1. Back in Supabase, paste:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)
2. Click **Save**

### Apple OAuth Setup (For iOS)

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Find **Apple** and click to expand
3. Toggle **Enable Sign in with Apple** to ON
4. You'll need an Apple Developer account ($99/year)

#### Create Apple OAuth Credentials:

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a new **App ID**
4. Enable **Sign in with Apple** capability
5. Create a **Services ID** for web auth
6. Configure the return URLs:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
7. Create a **Key** for Sign in with Apple
8. Download the key file (.p8)

#### Configure in Supabase:

1. Back in Supabase, enter:
   - **Services ID**
   - **Team ID**
   - **Key ID**
   - **Private Key** (paste contents of .p8 file)
2. Click **Save**

## Step 8: Test the Setup

1. Make sure your dev server is running:
   ```bash
   npx expo start --web --port 3003
   ```

2. Open http://localhost:3003 in your browser

3. You should see the login screen

4. Try creating a test account:
   - Click "Sign Up"
   - Enter a test email and password
   - Submit the form

5. Check the **Authentication** > **Users** tab in Supabase
   - You should see your new user
   - Check the **Table Editor** > **profiles** table
   - You should see a profile created automatically
   - Check **households** and **household_members** tables
   - A default household should be created for the user

## Step 9: OAuth Testing (If Configured)

### Test Google Sign-In:

1. Click "Continue with Google" on the login screen
2. Select your Google account
3. Grant permissions
4. You should be redirected back and logged in

### Test Apple Sign-In:

1. Click "Continue with Apple" on the login screen (iOS only)
2. Follow the Apple authentication flow
3. You should be redirected back and logged in

## Troubleshooting

### "Invalid API key" Error
- Double-check your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Restart your dev server after changing `.env`

### OAuth Not Working
- Verify redirect URLs match exactly in both provider settings and Supabase
- Check that OAuth credentials are correct
- Look at browser console for specific error messages

### Database Errors
- Re-run the migration SQL in the SQL Editor
- Check the Supabase logs in **Project Settings** > **API** > **Logs**

### Profile Not Created on Signup
- Check that the `handle_new_user()` trigger is working
- Look in **Database** > **Functions** to see if it exists
- Check Supabase logs for errors

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` already
2. **Use Row Level Security (RLS)** - Already configured in migration
3. **Rotate keys regularly** - Especially if exposed
4. **Enable email confirmation** - For production (Auth > Settings)
5. **Set up password requirements** - In Auth > Settings
6. **Monitor auth logs** - Check for suspicious activity

## Next Steps

Once authentication is working:

1. Set up storage buckets for user photos (in Supabase Storage)
2. Configure email templates (in Auth > Email Templates)
3. Set up production OAuth apps with production domains
4. Configure rate limiting for API calls
5. Set up monitoring and alerts

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- FridgeScan Issues: Create an issue in the repo

## Summary

You should now have:
- ✅ Supabase project created
- ✅ Database tables created with RLS policies
- ✅ Environment variables configured
- ✅ Email authentication working
- ✅ OAuth providers configured (optional)
- ✅ Auto-creation of profiles and households on signup
- ✅ Protected routes requiring authentication

Your FridgeScan app is now ready for development with full authentication!
