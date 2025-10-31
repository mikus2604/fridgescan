-- Fix infinite recursion in RLS policies
-- The key is to use SECURITY DEFINER functions to break the recursion chain

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their household memberships" ON public.household_members;
DROP POLICY IF EXISTS "Users can insert themselves as household members" ON public.household_members;
DROP POLICY IF EXISTS "Household owners/admins can manage members" ON public.household_members;
DROP POLICY IF EXISTS "Users can view their households" ON public.households;
DROP POLICY IF EXISTS "Users can create households" ON public.households;
DROP POLICY IF EXISTS "Household owners/admins can update households" ON public.households;

-- Create a helper function that bypasses RLS to check household membership
-- This breaks the circular reference chain
CREATE OR REPLACE FUNCTION public.is_household_member(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to check if user is owner/admin
CREATE OR REPLACE FUNCTION public.is_household_admin(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = household_uuid
      AND user_id = user_uuid
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate household_members policies using SECURITY DEFINER functions
-- This prevents recursion because the function bypasses RLS
CREATE POLICY "Users can view their household memberships"
  ON public.household_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as household members"
  ON public.household_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Don't add admin management policy yet - keep it simple to avoid recursion

-- Recreate households policies using the helper function
CREATE POLICY "Users can view their households"
  ON public.households
  FOR SELECT
  USING (public.is_household_member(id, auth.uid()));

CREATE POLICY "Users can create households"
  ON public.households
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Household owners/admins can update households"
  ON public.households
  FOR UPDATE
  USING (public.is_household_admin(id, auth.uid()));
