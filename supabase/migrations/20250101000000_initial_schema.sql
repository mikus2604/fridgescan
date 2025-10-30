-- FridgeScan Database Schema
-- This migration creates all tables needed for the FridgeScan app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- =============================================================================
-- HOUSEHOLDS TABLE
-- =============================================================================
-- Households for collaborative inventory management
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HOUSEHOLD MEMBERS TABLE
-- =============================================================================
-- Join table for household membership
CREATE TYPE household_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role household_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their household memberships"
  ON public.household_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to view households user belongs to
CREATE POLICY "Users can view their households"
  ON public.households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- STORAGE LOCATIONS TABLE
-- =============================================================================
-- Storage locations within a household (fridge, freezer, pantry, etc.)
CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view storage locations in their households"
  ON public.storage_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = storage_locations.household_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage storage locations in their households"
  ON public.storage_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = storage_locations.household_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- PRODUCTS TABLE (Cached barcode data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  size TEXT,
  image_url TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed - products are public cached data
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- INVENTORY ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  storage_location_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity_initial DECIMAL(10, 2) NOT NULL DEFAULT 1,
  quantity_current DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'count',
  expiry_date DATE,
  photo_url TEXT,
  notes TEXT,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inventory items in their households"
  ON public.inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage inventory items in their households"
  ON public.inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = inventory_items.household_id AND user_id = auth.uid()
    )
  );

-- =============================================================================
-- USAGE HISTORY TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10, 2) NOT NULL,
  quantity_remaining DECIMAL(10, 2) NOT NULL,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage history for their household items"
  ON public.usage_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_items i
      JOIN public.household_members hm ON i.household_id = hm.household_id
      WHERE i.id = usage_history.inventory_item_id AND hm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Create a default household for the user
  INSERT INTO public.households (name, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My') || '''s Household',
    NEW.id
  )
  RETURNING id INTO NEW.id; -- Store household id temporarily

  -- Add user as owner of their default household
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (
    (SELECT id FROM public.households WHERE created_by = NEW.id ORDER BY created_at DESC LIMIT 1),
    NEW.id,
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and household on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_storage_locations_updated_at
  BEFORE UPDATE ON public.storage_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_household_id ON public.storage_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_household_id ON public.inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON public.inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_removed_at ON public.inventory_items(removed_at);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_usage_history_inventory_item_id ON public.usage_history(inventory_item_id);
