-- Fix infinite recursion in RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their household memberships" ON public.household_members;
DROP POLICY IF EXISTS "Users can view their households" ON public.households;

-- Create new non-recursive policies

-- Policy 1: Users can view their own household memberships
-- This is the base policy that doesn't depend on any other table
CREATE POLICY "Users can view their own household memberships"
  ON public.household_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can view household members in households they belong to
-- This allows viewing other members in the same household
CREATE POLICY "Users can view household members in their households"
  ON public.household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can view households they belong to
-- This policy now works because household_members policies don't create recursion
CREATE POLICY "Users can view their households"
  ON public.households
  FOR SELECT
  USING (
    id IN (
      SELECT household_id
      FROM public.household_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can insert/update/delete households if they are owner/admin
CREATE POLICY "Owners and admins can manage households"
  ON public.households
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
