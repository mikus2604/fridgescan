-- Email-based Household Invitations
-- This migration adds email invitation functionality

-- =============================================================================
-- ENSURE HOUSEHOLD_MEMBERS HAS UNIQUE CONSTRAINT
-- =============================================================================
-- Add unique constraint if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'household_members_household_id_user_id_key'
  ) THEN
    ALTER TABLE public.household_members
    ADD CONSTRAINT household_members_household_id_user_id_key
    UNIQUE (household_id, user_id);
  END IF;
END $$;

-- =============================================================================
-- EMAIL INVITATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.household_email_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_invites_email ON public.household_email_invites(invitee_email);
CREATE INDEX IF NOT EXISTS idx_email_invites_status ON public.household_email_invites(status);
CREATE INDEX IF NOT EXISTS idx_email_invites_household ON public.household_email_invites(household_id);

-- RLS Policies for email invites
ALTER TABLE public.household_email_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites sent from their households
CREATE POLICY "Users can view invites from their households"
  ON public.household_email_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_email_invites.household_id
        AND user_id = auth.uid()
    )
  );

-- Users can view invites sent to their email
CREATE POLICY "Users can view invites sent to them"
  ON public.household_email_invites
  FOR SELECT
  USING (
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Household owners/admins can create invites
CREATE POLICY "Owners and admins can create invites"
  ON public.household_email_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_email_invites.household_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Users can update invites sent to them (accept/reject)
CREATE POLICY "Users can respond to their invites"
  ON public.household_email_invites
  FOR UPDATE
  USING (
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Owners/admins can delete invites from their household
CREATE POLICY "Owners and admins can delete invites"
  ON public.household_email_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_email_invites.household_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- FUNCTION TO AUTO-ACCEPT INVITES ON USER SIGNUP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.auto_accept_pending_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for pending invites for this email
  INSERT INTO public.household_members (household_id, user_id, role)
  SELECT
    household_id,
    NEW.id,
    'member'
  FROM public.household_email_invites
  WHERE invitee_email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW()
  ON CONFLICT (household_id, user_id) DO NOTHING;

  -- Update invites to accepted
  UPDATE public.household_email_invites
  SET
    status = 'accepted',
    responded_at = NOW()
  WHERE invitee_email = NEW.email
    AND status = 'pending'
    AND expires_at > NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-accept invites when user signs up
DROP TRIGGER IF EXISTS on_profile_created_check_invites ON public.profiles;
CREATE TRIGGER on_profile_created_check_invites
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_accept_pending_invites();

-- =============================================================================
-- FUNCTION TO SEND EMAIL INVITATIONS (using Supabase Auth Mailer)
-- =============================================================================
-- Note: This function creates the invite record. Email sending will be handled
-- by Supabase Edge Functions or external service
CREATE OR REPLACE FUNCTION public.create_email_invitation(
  p_household_id UUID,
  p_invitee_email TEXT,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
  v_invite_id UUID;
  v_inviter_id UUID;
  v_household_name TEXT;
BEGIN
  -- Get inviter ID
  v_inviter_id := auth.uid();

  -- Get household name
  SELECT name INTO v_household_name
  FROM public.households
  WHERE id = p_household_id;

  -- Check if user has permission (owner or admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id
      AND user_id = v_inviter_id
      AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only household owners and admins can send invitations';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members hm
    JOIN public.profiles p ON p.id = hm.user_id
    WHERE hm.household_id = p_household_id
      AND p.email = p_invitee_email
  ) THEN
    RAISE EXCEPTION 'User is already a member of this household';
  END IF;

  -- Check if there's already a pending invite (only block if still pending and not expired)
  IF EXISTS (
    SELECT 1 FROM public.household_email_invites
    WHERE household_id = p_household_id
      AND invitee_email = p_invitee_email
      AND status = 'pending'
      AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'An invitation has already been sent to this email. Please wait for it to expire or be responded to before sending another.';
  END IF;

  -- Note: If user previously rejected, they can be re-invited
  -- Expired or responded invitations don't block new invites

  -- Create the invite
  INSERT INTO public.household_email_invites (
    household_id,
    inviter_id,
    invitee_email,
    expires_at
  )
  VALUES (
    p_household_id,
    v_inviter_id,
    p_invitee_email,
    NOW() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_invite_id;

  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION TO ACCEPT EMAIL INVITATION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.accept_email_invitation(
  p_invite_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = auth.uid();

  -- Get invite details
  SELECT * INTO v_invite
  FROM public.household_email_invites
  WHERE id = p_invite_id;

  -- Validate invite
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invite.invitee_email != v_user_email THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  IF v_invite.status != 'pending' THEN
    RAISE EXCEPTION 'This invitation has already been responded to';
  END IF;

  IF v_invite.expires_at < NOW() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  -- Add user to household
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (v_invite.household_id, auth.uid(), 'member')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  -- Update invite status
  UPDATE public.household_email_invites
  SET
    status = 'accepted',
    responded_at = NOW()
  WHERE id = p_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- FUNCTION TO REJECT EMAIL INVITATION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.reject_email_invitation(
  p_invite_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = auth.uid();

  -- Get invite details
  SELECT * INTO v_invite
  FROM public.household_email_invites
  WHERE id = p_invite_id;

  -- Validate invite
  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  IF v_invite.invitee_email != v_user_email THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  IF v_invite.status != 'pending' THEN
    RAISE EXCEPTION 'This invitation has already been responded to';
  END IF;

  -- Update invite status
  UPDATE public.household_email_invites
  SET
    status = 'rejected',
    responded_at = NOW()
  WHERE id = p_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
