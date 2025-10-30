# Complete OAuth Setup for FridgeScan
## Production Domain: app.myfrigee.com

---

## ✅ STEP 1: Supabase Basic Authentication Settings

### Go to Supabase Dashboard
URL: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/auth/url-configuration

### Configure Site URL
```
https://app.myfrigee.com
```

### Configure Redirect URLs (Add ALL of these)
```
http://localhost:3003/auth/callback
https://app.myfrigee.com/auth/callback
fridgescan://auth/callback
```

Click **Save**

---

## ✅ STEP 2: Google OAuth Setup

### Part A: Google Cloud Console Setup

#### 1. Go to Google Cloud Console
URL: https://console.cloud.google.com/

#### 2. Create or Select Project
- Click project dropdown (top left)
- Click "New Project"
- Name: `FridgeScan`
- Click "Create"
- Wait for project to be created (30 seconds)

#### 3. Enable Required APIs
- Go to: **APIs & Services** > **Library**
- Search for: `Google+ API`
- Click on it
- Click **Enable**

#### 4. Configure OAuth Consent Screen
- Go to: **APIs & Services** > **OAuth consent screen**
- Select **External** user type
- Click **Create**

Fill in the form:
```
App name: FridgeScan
User support email: [your-email@domain.com]
App logo: (optional)

Developer contact information:
Email: [your-email@domain.com]
```

- Click **Save and Continue**
- On "Scopes" page: Click **Save and Continue** (skip scopes)
- On "Test users" page: Add your email as a test user
- Click **Save and Continue**
- Review and click **Back to Dashboard**

#### 5. Create OAuth 2.0 Client ID
- Go to: **APIs & Services** > **Credentials**
- Click **+ Create Credentials**
- Select **OAuth 2.0 Client ID**

Configure:
```
Application type: Web application
Name: FridgeScan Web Client
```

**Authorized JavaScript origins** (add both):
```
https://xcvhnqofiazdjyxvbjwj.supabase.co
https://app.myfrigee.com
```

**Authorized redirect URIs** (add both):
```
https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
https://app.myfrigee.com/auth/callback
```

For local development, also add:
```
http://localhost:3003
http://localhost:3003/auth/callback
```

Click **Create**

#### 6. Copy Your Credentials
You'll see a popup with:
```
Client ID: [something].apps.googleusercontent.com
Client Secret: [long random string]
```

**SAVE THESE CREDENTIALS!** You'll need them in the next step.

### Part B: Configure in Supabase

#### 1. Go to Supabase Dashboard
URL: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/auth/providers

#### 2. Find Google Provider
- Scroll to **Google**
- Click to expand

#### 3. Enable and Configure
- Toggle **Enable Sign in with Google** to ON

Paste your Google credentials:
```
Client ID: [paste from Google Cloud Console]
Client Secret: [paste from Google Cloud Console]
```

The **Authorized Client IDs** field can be left empty.

Click **Save**

---

## ✅ STEP 3: Apple OAuth Setup (Optional - iOS Only)

**Note:** Requires Apple Developer Program membership ($99/year)

### Part A: Apple Developer Portal Setup

#### 1. Go to Apple Developer Portal
URL: https://developer.apple.com/account/resources/identifiers/list

#### 2. Create App ID
- Click **+** (Add button)
- Select **App IDs**
- Click **Continue**
- Select **App** type
- Click **Continue**

Fill in:
```
Description: FridgeScan
Bundle ID: Explicit
Bundle ID value: com.justarieldotcom.fridgescan
```

Scroll down to **Capabilities**:
- Check **Sign in with Apple**
- Click **Continue**
- Click **Register**

#### 3. Create Services ID (for Web Auth)
- Click **+** (Add button)
- Select **Services IDs**
- Click **Continue**

Fill in:
```
Description: FridgeScan Web
Identifier: com.justarieldotcom.fridgescan.web
```

- Check **Sign in with Apple**
- Click **Configure** next to Sign in with Apple

Configure:
```
Primary App ID: com.justarieldotcom.fridgescan

Domains and Subdomains (add both):
  xcvhnqofiazdjyxvbjwj.supabase.co
  app.myfrigee.com

Return URLs (add both):
  https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
  https://app.myfrigee.com/auth/callback
```

- Click **Save**
- Click **Continue**
- Click **Register**

#### 4. Create a Key for Sign in with Apple
- Go to **Keys** section (left sidebar)
- Click **+** (Add button)

Fill in:
```
Key Name: FridgeScan Sign in with Apple Key
```

- Check **Sign in with Apple**
- Click **Configure** next to it
- Select Primary App ID: `com.justarieldotcom.fridgescan`
- Click **Save**
- Click **Continue**
- Click **Register**

**IMPORTANT - Download the Key:**
- Click **Download** (YOU CAN ONLY DO THIS ONCE!)
- Save the `.p8` file securely
- Note the **Key ID** (10 characters) shown on screen

#### 5. Get Your Team ID
- Go to: https://developer.apple.com/account
- Look for **Team ID** in the top section
- Copy it (format: ABC1234DEF - 10 characters)

### Part B: Configure in Supabase

#### 1. Go to Supabase Dashboard
URL: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/auth/providers

#### 2. Find Apple Provider
- Scroll to **Apple**
- Click to expand

#### 3. Enable and Configure
- Toggle **Enable Sign in with Apple** to ON

Fill in:
```
Services ID: com.justarieldotcom.fridgescan.web
Team ID: [Your 10-character Team ID]
Key ID: [Key ID from the key you created]
```

**Private Key:**
- Open the downloaded `.p8` file in a text editor
- Copy the ENTIRE contents (including BEGIN and END lines)
- Paste into the Private Key field

Example format:
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
(many more lines)
...
-----END PRIVATE KEY-----
```

Click **Save**

---

## ✅ STEP 4: Configure CORS for Production Domain

### In Supabase Dashboard
URL: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/settings/api

Scroll to **CORS Origins**

Add your domain:
```
https://app.myfrigee.com
```

Click **Save**

---

## ✅ STEP 5: Update DNS for app.myfrigee.com

You need to point `app.myfrigee.com` to your hosting provider.

### If using Vercel:
1. Go to Vercel Dashboard
2. Add domain: `app.myfrigee.com`
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### If using other hosting:
Point `app.myfrigee.com` to your server's IP or hosting provider's CNAME.

---

## ✅ STEP 6: Test Everything

### Test Locally (Development)

1. Make sure dev server is running:
   ```bash
   npx expo start --web --port 3003
   ```

2. Open: http://localhost:3003

3. Test each auth method:
   - ✓ Email signup/login
   - ✓ Google OAuth (click "Continue with Google")
   - ✓ Apple OAuth (iOS only)

### Test in Production

1. Deploy your app to production (Vercel, etc.)

2. Open: https://app.myfrigee.com

3. Test each auth method:
   - ✓ Email signup/login
   - ✓ Google OAuth
   - ✓ Apple OAuth (iOS only)

---

## 📝 Configuration Summary

### Supabase Project
```
Project URL: https://xcvhnqofiazdjyxvbjwj.supabase.co
Site URL: https://app.myfrigee.com

Redirect URLs:
- http://localhost:3003/auth/callback (dev)
- https://app.myfrigee.com/auth/callback (production)
- fridgescan://auth/callback (mobile)
```

### Google OAuth
```
Authorized JavaScript Origins:
- https://xcvhnqofiazdjyxvbjwj.supabase.co
- https://app.myfrigee.com
- http://localhost:3003 (dev)

Authorized Redirect URIs:
- https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
- https://app.myfrigee.com/auth/callback
- http://localhost:3003/auth/callback (dev)
```

### Apple OAuth
```
Services ID: com.justarieldotcom.fridgescan.web

Domains:
- xcvhnqofiazdjyxvbjwj.supabase.co
- app.myfrigee.com

Return URLs:
- https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
- https://app.myfrigee.com/auth/callback
```

---

## 🔧 Troubleshooting

### Common Issues

**"redirect_uri_mismatch" (Google)**
- Verify redirect URIs in Google Console exactly match
- Check for typos in URLs
- Ensure `https://` is included (not `http://` for production)

**"Invalid client" Error**
- Double-check Client ID and Secret
- Remove any trailing spaces when pasting
- Verify OAuth provider is enabled in Supabase

**CORS Errors**
- Add `https://app.myfrigee.com` to CORS origins in Supabase
- Clear browser cache
- Check Network tab in browser DevTools

**OAuth Loop/Redirect Issues**
- Verify Site URL is set correctly in Supabase
- Check that redirect URLs include `/auth/callback` path
- Clear cookies and try again

**Apple OAuth Not Working**
- Ensure .p8 key is pasted completely (including BEGIN/END)
- Verify Team ID and Key ID are correct
- Check Services ID matches exactly
- Only works on iOS (not web)

### Check Logs

**Supabase Logs:**
- Go to: Project Settings > API > Logs
- Filter by "auth" to see authentication events
- Look for specific error messages

**Browser Console:**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

## ✅ Final Checklist

Before going to production:

- [ ] Supabase Site URL set to `https://app.myfrigee.com`
- [ ] All redirect URLs added in Supabase
- [ ] Google OAuth configured with production URLs
- [ ] Apple OAuth configured (if needed for iOS)
- [ ] CORS origins updated in Supabase
- [ ] DNS configured for app.myfrigee.com
- [ ] Tested email authentication locally
- [ ] Tested Google OAuth locally
- [ ] Tested Apple OAuth on iOS (if applicable)
- [ ] Deployed to production
- [ ] Tested all auth methods in production
- [ ] Verified user profiles are created in database
- [ ] Verified households are auto-created
- [ ] Email templates customized (optional)
- [ ] Rate limiting configured (optional)

---

## 🎉 Success!

Once all steps are complete, your FridgeScan app will have:

- ✅ Email/Password authentication
- ✅ Google OAuth (web, iOS, Android)
- ✅ Apple OAuth (iOS only)
- ✅ Automatic user profile creation
- ✅ Automatic household creation
- ✅ Protected routes
- ✅ Works on localhost and production
- ✅ Cross-platform (web, iOS, Android)

Users can now sign up and log in using any of these methods!
