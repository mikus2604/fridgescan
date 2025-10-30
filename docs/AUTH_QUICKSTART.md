# Authentication Quick Start Guide

This is a condensed version of the full setup. For detailed instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Prerequisites
- Node.js and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- Supabase account ([supabase.com](https://supabase.com))

## Quick Setup (5 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose name, password, region
3. Wait for provisioning (~2 minutes)

### 2. Run Database Migration
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `docs/supabase_migration.sql`
3. Paste and click **Run**
4. Verify tables created in Table Editor

### 3. Configure Environment
1. In Supabase: Project Settings → API
2. Copy **Project URL** and **anon public key**
3. Create `.env` in project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Install Dependencies
```bash
npm install
```

Dependencies already included:
- @supabase/supabase-js
- expo-secure-store
- expo-web-browser
- expo-linking
- expo-auth-session
- react-native-url-polyfill

### 5. Start Development Server
```bash
npm run web
# or
npm start
```

### 6. Test Authentication
1. Navigate to `http://localhost:3003/auth/register`
2. Create an account with email/password
3. Check Supabase Dashboard → Authentication → Users
4. Verify database triggers created:
   - Profile in `profiles` table
   - Household in `households` table
   - Membership in `household_members` table
   - 3 storage locations in `storage_locations` table

## Features Implemented

### Email Authentication
- ✅ Registration with email/password
- ✅ Login with email/password
- ✅ Email verification (optional)
- ✅ Password reset

### Social Authentication
- ✅ Google OAuth (requires Google Cloud Console setup)
- ✅ Apple Sign In (requires Apple Developer setup)

### Database Features
- ✅ User profiles (auto-created on signup)
- ✅ Households (auto-created with default "My Household")
- ✅ Household members with roles (owner, admin, member, viewer)
- ✅ Household invitations with codes
- ✅ Storage locations (Fridge, Freezer, Pantry)
- ✅ Row-level security (RLS) policies
- ✅ Multi-household support per user

### App Features
- ✅ Secure token storage (expo-secure-store)
- ✅ Session persistence
- ✅ Auto-refresh tokens
- ✅ Auth state management (React Context)
- ✅ Dark mode support
- ✅ Loading states
- ✅ Error handling

## Project Structure

```
fridgescan/
├── src/
│   ├── lib/
│   │   └── supabase.ts              # Supabase client
│   ├── contexts/
│   │   └── AuthContext.tsx          # Auth state & methods
│   ├── services/
│   │   └── household.service.ts     # Household operations
│   ├── types/
│   │   └── database.types.ts        # TypeScript types
│   └── ...
├── app/
│   ├── auth/
│   │   ├── login.tsx                # Login screen
│   │   └── register.tsx             # Registration screen
│   └── _layout.tsx                  # Root with AuthProvider
└── docs/
    ├── AUTH_IMPLEMENTATION_PLAN.md  # Full implementation plan
    ├── SUPABASE_SETUP.md            # Detailed setup guide
    ├── supabase_migration.sql       # Database schema
    └── AUTH_QUICKSTART.md           # This file
```

## Using Authentication in Your App

### Get Current User
```typescript
import { useAuth } from '../src/contexts/AuthContext';

function MyComponent() {
  const { user, profile, households, currentHousehold } = useAuth();

  return (
    <View>
      <Text>Hello, {profile?.full_name}!</Text>
      <Text>Current Household: {currentHousehold?.name}</Text>
    </View>
  );
}
```

### Sign Out
```typescript
import { useAuth } from '../src/contexts/AuthContext';

function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    // User will be redirected to login automatically
  };

  return (
    <Button title="Sign Out" onPress={handleSignOut} />
  );
}
```

### Check Auth State
```typescript
import { useAuth } from '../src/contexts/AuthContext';

function ProtectedScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to login
    return <Redirect href="/auth/login" />;
  }

  return <YourProtectedContent />;
}
```

### Access Current Household
```typescript
import { useAuth } from '../src/contexts/AuthContext';

function AddItemScreen() {
  const { currentHousehold } = useAuth();

  // All items added will belong to currentHousehold
  const addItem = async (itemData) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        ...itemData,
        household_id: currentHousehold.id,
      });
  };
}
```

## Next Steps

### Enable Social Authentication (Optional)

#### Google OAuth
1. Follow guide: [docs/SUPABASE_SETUP.md#4-configure-google-oauth](./SUPABASE_SETUP.md#4-configure-google-oauth)
2. Create Google Cloud project
3. Configure OAuth credentials
4. Add to Supabase dashboard

#### Apple Sign In
1. Follow guide: [docs/SUPABASE_SETUP.md#5-configure-apple-sign-in](./SUPABASE_SETUP.md#5-configure-apple-sign-in)
2. Apple Developer account required ($99/year)
3. Create Service ID and private key
4. Add to Supabase dashboard

### Implement Protected Routes
Create a wrapper component:
```typescript
// src/components/auth/ProtectedRoute.tsx
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'expo-router';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/auth/login" />;

  return children;
}
```

### Add Household Invitation UI
```typescript
import { householdService } from '../src/services/household.service';

async function generateInvite() {
  const { data: invite, error } = await householdService.generateInviteCode(
    currentHousehold.id,
    user.id,
    7 // expires in 7 days
  );

  if (!error) {
    // Share invite.invite_code via SMS, email, QR code
    console.log('Invite Code:', invite.invite_code);
  }
}

async function joinHousehold(inviteCode: string) {
  const { data, error } = await householdService.joinHousehold(
    inviteCode,
    user.id
  );

  if (!error) {
    await refreshHouseholds(); // Reload households list
  }
}
```

### Connect to Existing Inventory System
Update your existing inventory store/hooks to:
1. Filter items by `currentHousehold.id`
2. Include `household_id` when creating items
3. Include `added_by` to track who added items

### Add Profile Management
Create a profile screen where users can:
- Update full name
- Upload avatar
- Change email
- Change password
- Manage notification preferences

## Common Issues

### "Supabase Not Configured" message
- Verify `.env` file exists and has correct values
- Restart development server after adding `.env`
- Check values don't have quotes or extra spaces

### Can't see login/register screens
- Navigate to: `http://localhost:3003/auth/login`
- Or add navigation button from home screen

### User created but no household
- Check Supabase logs for trigger errors
- Verify triggers exist in SQL Editor
- Re-run migration if needed

### RLS policy errors
- User must be authenticated
- Check `auth.uid()` returns user ID
- Verify user is member of household

## Resources

- **Full Setup Guide**: [docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Implementation Plan**: [docs/AUTH_IMPLEMENTATION_PLAN.md](./AUTH_IMPLEMENTATION_PLAN.md)
- **Database Schema**: [docs/supabase_migration.sql](./supabase_migration.sql)
- **Supabase Docs**: https://supabase.com/docs
- **Expo Auth Guide**: https://docs.expo.dev/guides/authentication/

## Support

Questions or issues? Check:
1. Troubleshooting section in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md#troubleshooting)
2. Supabase Dashboard → Logs
3. Browser DevTools Console
4. Supabase Discord community
