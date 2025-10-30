-- FridgeScan Database Schema Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLES
-- ==============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Household membership with roles
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Household invitations
CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage locations
CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products cache
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity_current DECIMAL NOT NULL,
  quantity_unit TEXT NOT NULL,
  expiry_date DATE,
  purchase_date DATE,
  notes TEXT,
  photo_url TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage history
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity_used DECIMAL NOT NULL,
  quantity_remaining DECIMAL NOT NULL,
  action_type TEXT CHECK (action_type IN ('used', 'added', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_household ON inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_storage_locations_household ON storage_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_item ON usage_history(inventory_item_id);

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Households policies
DROP POLICY IF EXISTS "Users can view their households" ON public.households;
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create households" ON public.households;
CREATE POLICY "Users can create households" ON public.households
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners can update households" ON public.households;
CREATE POLICY "Owners can update households" ON public.households
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Owners can delete households" ON public.households;
CREATE POLICY "Owners can delete households" ON public.households
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Household members policies
DROP POLICY IF EXISTS "View household members" ON public.household_members;
CREATE POLICY "View household members" ON public.household_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can add members" ON public.household_members;
CREATE POLICY "Admins can add members" ON public.household_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_members.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update members" ON public.household_members;
CREATE POLICY "Admins can update members" ON public.household_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can remove members" ON public.household_members;
CREATE POLICY "Admins can remove members" ON public.household_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
    )
  );

-- Storage locations policies
DROP POLICY IF EXISTS "View household storage" ON public.storage_locations;
CREATE POLICY "View household storage" ON public.storage_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = storage_locations.household_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can manage storage" ON public.storage_locations;
CREATE POLICY "Members can manage storage" ON public.storage_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = storage_locations.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Inventory items policies
DROP POLICY IF EXISTS "View household inventory" ON public.inventory_items;
CREATE POLICY "View household inventory" ON public.inventory_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can add inventory" ON public.inventory_items;
CREATE POLICY "Members can add inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

DROP POLICY IF EXISTS "Members can update inventory" ON public.inventory_items;
CREATE POLICY "Members can update inventory" ON public.inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

DROP POLICY IF EXISTS "Members can delete inventory" ON public.inventory_items;
CREATE POLICY "Members can delete inventory" ON public.inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Products policies (public cache)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can cache products" ON public.products;
CREATE POLICY "Authenticated users can cache products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Usage history policies
DROP POLICY IF EXISTS "View household usage history" ON public.usage_history;
CREATE POLICY "View household usage history" ON public.usage_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items
      JOIN public.household_members ON household_members.household_id = inventory_items.household_id
      WHERE inventory_items.id = usage_history.inventory_item_id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can log usage" ON public.usage_history;
CREATE POLICY "Members can log usage" ON public.usage_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_items
      JOIN public.household_members ON household_members.household_id = inventory_items.household_id
      WHERE inventory_items.id = usage_history.inventory_item_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin', 'member')
    )
  );

-- ==============================================
-- FUNCTIONS
-- ==============================================

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

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to create default household
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_household();

-- ==============================================
-- COMPLETED
-- ==============================================

-- Migration completed successfully
-- Next steps:
-- 1. Configure authentication providers (Email, Google, Apple) in Supabase Dashboard
-- 2. Set up redirect URLs for OAuth
-- 3. Update .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
