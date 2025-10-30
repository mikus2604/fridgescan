# Supabase Authentication & Household Sharing Implementation Plan

## Overview
This document outlines the complete implementation of authentication and household sharing using Supabase for FridgeScan.

## Phase 1: Supabase Setup & Configuration

### 1.1 Project Setup
- [ ] Create Supabase project at supabase.com
- [ ] Install required dependencies:
  - `@supabase/supabase-js` - Supabase client
  - `expo-secure-store` - Secure token storage
  - `expo-web-browser` - OAuth flows
  - `expo-linking` - Deep linking for OAuth callbacks
  - `expo-auth-session` - OAuth session management

### 1.2 Environment Configuration
- [ ] Add Supabase credentials to `.env`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Configure OAuth redirect URLs in Supabase dashboard
- [ ] Set up Google OAuth (Google Cloud Console)
- [ ] Set up Apple Sign In (Apple Developer Portal)

### 1.3 OAuth Provider Setup

#### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - Web: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
   - iOS: `com.fridgescan.app://google-auth`
   - Android: `com.fridgescan.app://google-auth`
4. Copy Client ID and Secret to Supabase

#### Apple Sign In
1. Go to Apple Developer Portal
2. Create Sign In with Apple capability
3. Configure Service ID and Return URLs
4. Add to Supabase Apple provider settings

## Phase 2: Database Schema & RLS

### 2.1 Database Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households table
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household membership with roles
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Household invitations
CREATE TABLE public.household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage locations
CREATE TABLE public.storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products cache
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_days INTEGER DEFAULT 90
);

-- Inventory items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id),
  name TEXT NOT NULL,
  quantity_current DECIMAL NOT NULL,
  quantity_unit TEXT NOT NULL,
  expiry_date DATE,
  purchase_date DATE,
  notes TEXT,
  photo_url TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage history
CREATE TABLE public.usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  quantity_used DECIMAL NOT NULL,
  quantity_remaining DECIMAL NOT NULL,
  action_type TEXT CHECK (action_type IN ('used', 'added', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_inventory_household ON inventory_items(household_id);
CREATE INDEX idx_inventory_expiry ON inventory_items(expiry_date);
CREATE INDEX idx_products_barcode ON products(barcode);
```

### 2.2 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Households: Users can view households they're members of
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households" ON public.households
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Household members: View members of households you belong to
CREATE POLICY "View household members" ON public.household_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members" ON public.household_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_members.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Inventory: Full CRUD for household members
CREATE POLICY "View household inventory" ON public.inventory_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can update inventory" ON public.inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Members can delete inventory" ON public.inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Products: Public read, system writes
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can cache products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### 2.3 Database Functions

```sql
-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-create default household for new users
CREATE OR REPLACE FUNCTION public.create_default_household()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO public.households (name, created_by)
  VALUES ('My Household', NEW.id)
  RETURNING id INTO new_household_id;

  -- Add user as owner
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, NEW.id, 'owner');

  -- Create default storage locations
  INSERT INTO public.storage_locations (household_id, name, icon, color)
  VALUES
    (new_household_id, 'Fridge', 'fridge', '#3B82F6'),
    (new_household_id, 'Freezer', 'snowflake', '#06B6D4'),
    (new_household_id, 'Pantry', 'cabinet', '#8B5CF6');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default household
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_household();

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Phase 3: Application Implementation

### 3.1 Project Structure
```
src/
├── lib/
│   └── supabase.ts              # Supabase client setup
├── contexts/
│   └── AuthContext.tsx          # Auth state management
├── hooks/
│   ├── useAuth.ts               # Auth operations
│   ├── useHousehold.ts          # Household operations
│   └── useInvites.ts            # Invitation management
├── services/
│   ├── auth.service.ts          # Auth API calls
│   └── household.service.ts     # Household API calls
├── types/
│   └── database.types.ts        # TypeScript types from Supabase
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── OnboardingScreen.tsx
│   └── household/
│       ├── HouseholdScreen.tsx
│       ├── InviteMembersScreen.tsx
│       └── JoinHouseholdScreen.tsx
└── components/
    ├── auth/
    │   ├── SocialAuthButton.tsx
    │   └── EmailAuthForm.tsx
    └── household/
        └── HouseholdSelector.tsx
```

### 3.2 Implementation Steps

#### Step 1: Supabase Client Setup
- Create `src/lib/supabase.ts` with client configuration
- Implement secure token storage using expo-secure-store
- Set up auth state change listener

#### Step 2: Type Generation
- Generate TypeScript types from Supabase schema
- Create type definitions for all database tables

#### Step 3: Auth Context
- Create AuthContext with user state
- Implement sign in, sign up, sign out methods
- Handle session refresh automatically

#### Step 4: Auth Services
- Email/password authentication
- Google OAuth flow
- Apple OAuth flow
- Password reset flow

#### Step 5: UI Components
- Login screen with social buttons
- Registration form
- OAuth loading states
- Error handling UI

#### Step 6: Household Management
- Create household service
- Household selector component
- Invite generation and management
- Join household via code/link

#### Step 7: Protected Routes
- Route guard component
- Redirect to login when unauthenticated
- Deep linking for invites

## Phase 4: Testing & Security

### 4.1 Testing Checklist
- [ ] Email signup and login
- [ ] Google OAuth on web, iOS, Android
- [ ] Apple Sign In on iOS
- [ ] Password reset flow
- [ ] Session persistence across app restarts
- [ ] RLS policies prevent unauthorized access
- [ ] Invite codes work correctly
- [ ] Multiple household membership
- [ ] Household role permissions

### 4.2 Security Checklist
- [ ] Tokens stored securely (expo-secure-store)
- [ ] RLS enabled on all tables
- [ ] API keys in environment variables
- [ ] OAuth redirect URLs whitelisted
- [ ] Invite codes expire after 7 days
- [ ] Rate limiting on invite generation
- [ ] Audit logging for membership changes

## Phase 5: User Flows

### Flow 1: New User Registration (Email)
1. User enters email, password, full name
2. Supabase creates auth.users entry
3. Trigger creates profile
4. Trigger creates default household + storage locations
5. User auto-enrolled as household owner
6. Redirect to home screen

### Flow 2: Social Login (Google/Apple)
1. User clicks "Continue with Google/Apple"
2. OAuth flow opens in browser
3. User authorizes access
4. Redirects back to app with session
5. Same profile/household triggers as email signup
6. Redirect to home screen

### Flow 3: Invite Family Member
1. Owner/admin opens household settings
2. Clicks "Invite Member"
3. System generates 8-char invite code
4. Share via SMS, email, or QR code
5. Recipient clicks link/enters code
6. Added to household with "member" role

### Flow 4: Join Household
1. User receives invite link: `fridgescan://join/ABC12345`
2. Opens app (or installs if not present)
3. If not logged in, prompted to sign up/login
4. Confirms joining household name
5. Added to household_members
6. Can now access household inventory

## Implementation Timeline

### Week 1: Foundation
- Days 1-2: Supabase project setup, OAuth configuration
- Days 3-5: Database schema, RLS policies, triggers
- Days 6-7: Generate types, create Supabase client

### Week 2: Core Auth
- Days 1-3: Auth context, email auth, protected routes
- Days 4-5: Google OAuth implementation
- Days 6-7: Apple Sign In implementation

### Week 3: Household Features
- Days 1-3: Household service, UI components
- Days 4-5: Invitation system
- Days 6-7: Testing and bug fixes

## Environment Variables Required

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OAuth (for reference, configured in Supabase dashboard)
# Google Client ID and Secret
# Apple Service ID and Key
```

## Deep Linking Setup

### iOS (app.json)
```json
{
  "expo": {
    "scheme": "fridgescan",
    "ios": {
      "associatedDomains": [
        "applinks:fridgescan.app"
      ]
    }
  }
}
```

### Android (app.json)
```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "fridgescan"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Success Metrics

- [ ] Users can sign up via email in < 30 seconds
- [ ] Social login works on all platforms
- [ ] Invite acceptance rate > 80%
- [ ] Zero unauthorized data access attempts
- [ ] Session persists for 30 days
- [ ] < 5% auth error rate

## Support & Documentation

- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Expo Auth Session: https://docs.expo.dev/guides/authentication/
- Apple Sign In: https://docs.expo.dev/guides/apple-authentication/
- Google Sign In: https://docs.expo.dev/guides/google-authentication/
