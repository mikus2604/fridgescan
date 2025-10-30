-- Fix infinite recursion in RLS policies
-- This migration fixes the circular dependency between households and household_members policies

-- Drop ALL existing policies on these tables to start fresh
DROP POLICY IF EXISTS "Users can view their households" ON public.households;
DROP POLICY IF EXISTS "Users can view their household memberships" ON public.household_members;
DROP POLICY IF EXISTS "Users can create households" ON public.households;
DROP POLICY IF EXISTS "Owners and admins can update households" ON public.households;
DROP POLICY IF EXISTS "Owners can delete households" ON public.households;
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.household_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.household_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON public.household_members;

-- Create a security definer function to check household membership
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.user_is_household_member(household_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = household_uuid
      AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate household_members policy (simple, no recursion)
CREATE POLICY "Users can view their household memberships"
  ON public.household_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Recreate households policy using the security definer function
CREATE POLICY "Users can view their households"
  ON public.households
  FOR SELECT
  USING (public.user_is_household_member(id, auth.uid()));

-- Add INSERT policy for households (users can create new households)
CREATE POLICY "Users can create households"
  ON public.households
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Add UPDATE policy for households (only owners/admins)
CREATE POLICY "Owners and admins can update households"
  ON public.households
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Add DELETE policy for households (only owners)
CREATE POLICY "Owners can delete households"
  ON public.households
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- Add INSERT/UPDATE/DELETE policies for household_members
CREATE POLICY "Owners and admins can add members"
  ON public.household_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON public.household_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON public.household_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
        AND hm.user_id = auth.uid()
        AND hm.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid() -- Users can remove themselves
  );
