# Quick Setup Values - Copy & Paste Reference

## 🔹 Supabase Configuration

### Dashboard URL
```
https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj
```

### Site URL
```
https://app.myfrigee.com
```

### Redirect URLs (add all 3)
```
http://localhost:3003/auth/callback
https://app.myfrigee.com/auth/callback
fridgescan://auth/callback
```

---

## 🔹 Google Cloud Console Configuration

### Authorized JavaScript Origins (add all 3)
```
https://xcvhnqofiazdjyxvbjwj.supabase.co
https://app.myfrigee.com
http://localhost:3003
```

### Authorized Redirect URIs (add all 3)
```
https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
https://app.myfrigee.com/auth/callback
http://localhost:3003/auth/callback
```

---

## 🔹 Apple Developer Configuration

### App ID
```
com.justarieldotcom.fridgescan
```

### Services ID
```
com.justarieldotcom.fridgescan.web
```

### Domains (add both)
```
xcvhnqofiazdjyxvbjwj.supabase.co
app.myfrigee.com
```

### Return URLs (add both)
```
https://xcvhnqofiazdjyxvbjwj.supabase.co/auth/v1/callback
https://app.myfrigee.com/auth/callback
```

---

## 📋 Step-by-Step Checklist

### Supabase (5 minutes)
- [ ] Go to: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/auth/url-configuration
- [ ] Set Site URL: `https://app.myfrigee.com`
- [ ] Add all 3 Redirect URLs
- [ ] Save

### Google OAuth (15 minutes)
- [ ] Go to: https://console.cloud.google.com/
- [ ] Create project "FridgeScan"
- [ ] Enable Google+ API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth Client ID (Web application)
- [ ] Add all 3 JavaScript origins
- [ ] Add all 3 Redirect URIs
- [ ] Copy Client ID and Secret
- [ ] Go to Supabase: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/auth/providers
- [ ] Enable Google provider
- [ ] Paste Client ID and Secret
- [ ] Save

### Apple OAuth (30 minutes - Optional)
- [ ] Go to: https://developer.apple.com/account/resources/identifiers/list
- [ ] Create App ID: `com.justarieldotcom.fridgescan`
- [ ] Enable "Sign in with Apple" capability
- [ ] Create Services ID: `com.justarieldotcom.fridgescan.web`
- [ ] Configure with both domains and return URLs
- [ ] Create Key for Sign in with Apple
- [ ] Download .p8 key file (ONLY ONCE!)
- [ ] Note Key ID and Team ID
- [ ] Go to Supabase providers
- [ ] Enable Apple provider
- [ ] Enter Services ID, Team ID, Key ID, and Private Key
- [ ] Save

### Test (5 minutes)
- [ ] Open: http://localhost:3003
- [ ] Try email signup
- [ ] Try Google OAuth
- [ ] Verify login works
- [ ] Check Supabase Tables for user/profile/household

---

## ✅ You're Done!

After completing these steps:
- Email authentication works immediately
- Google OAuth works on web, iOS, Android
- Apple OAuth works on iOS
- Users automatically get profiles and households
- Protected routes work correctly

For full details, see: **COMPLETE_OAUTH_SETUP.md**
