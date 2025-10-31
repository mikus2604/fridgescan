import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];
type HouseholdInvite = Database['public']['Tables']['household_invites']['Row'];

export const householdService = {
  // Create a new household
  async createHousehold(name: string, userId: string) {
    try {
      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ name, created_by: userId } as any)
        .select()
        .single();

      if (householdError) throw householdError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: (household as any).id,
          user_id: userId,
          role: 'owner',
        } as any);

      if (memberError) throw memberError;

      // Create default storage locations
      const { error: locationsError } = await supabase
        .from('storage_locations')
        .insert([
          { household_id: (household as any).id, name: 'Fridge', icon: 'fridge', color: '#3B82F6' },
          { household_id: (household as any).id, name: 'Freezer', icon: 'snowflake', color: '#06B6D4' },
          { household_id: (household as any).id, name: 'Pantry', icon: 'cabinet', color: '#8B5CF6' },
        ] as any);

      if (locationsError) throw locationsError;

      return { data: household, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Generate invite code
  async generateInviteCode(householdId: string, userId: string, expiresInDays: number = 7) {
    try {
      // Generate random 8-character code
      const { data: code, error: codeError } = await supabase.rpc('generate_invite_code');

      if (codeError) throw codeError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data: invite, error: inviteError } = await supabase
        .from('household_invites')
        .insert({
          household_id: householdId,
          invite_code: code,
          created_by: userId,
          expires_at: expiresAt.toISOString(),
          max_uses: 10,
        } as any)
        .select()
        .single();

      if (inviteError) throw inviteError;

      return { data: invite, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Validate and get invite details
  async validateInviteCode(inviteCode: string) {
    try {
      const { data: invite, error } = await supabase
        .from('household_invites')
        .select(`
          *,
          households (*)
        `)
        .eq('invite_code', inviteCode)
        .single();

      if (error) throw error;

      // Check if expired
      const now = new Date();
      const expiresAt = new Date((invite as any).expires_at);
      if (now > expiresAt) {
        return { data: null, error: { message: 'Invite code has expired' } };
      }

      // Check if max uses reached
      if ((invite as any).used_count >= (invite as any).max_uses) {
        return { data: null, error: { message: 'Invite code has reached maximum uses' } };
      }

      return { data: invite, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Join household using invite code
  async joinHousehold(inviteCode: string, userId: string) {
    try {
      // Validate invite
      const { data: invite, error: validateError } = await this.validateInviteCode(inviteCode);

      if (validateError || !invite) {
        return { data: null, error: validateError || { message: 'Invalid invite code' } };
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', (invite as any).household_id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return { data: null, error: { message: 'You are already a member of this household' } };
      }

      // Add user as member
      const { data: member, error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: (invite as any).household_id,
          user_id: userId,
          role: 'member',
        } as any)
        .select()
        .single();

      if (memberError) throw memberError;

      // Increment used count
      const { error: updateError } = await (supabase
        .from('household_invites') as any)
        .update({ used_count: (invite as any).used_count + 1 })
        .eq('id', (invite as any).id);

      if (updateError) throw updateError;

      return { data: member, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Get household members
  async getHouseholdMembers(householdId: string) {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          *,
          profiles (*)
        `)
        .eq('household_id', householdId);

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Update member role
  async updateMemberRole(memberId: string, role: HouseholdMember['role']) {
    try {
      const { data, error } = await (supabase
        .from('household_members') as any)
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Remove member from household
  async removeMember(memberId: string) {
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Update household name
  async updateHousehold(householdId: string, updates: Partial<Household>) {
    try {
      const { data, error } = await (supabase
        .from('households') as any)
        .update(updates)
        .eq('id', householdId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Leave household
  async leaveHousehold(householdId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', userId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Delete household (owner only)
  async deleteHousehold(householdId: string) {
    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // =============================================================================
  // EMAIL-BASED INVITATIONS
  // =============================================================================

  // Send email invitation to join household
  async sendEmailInvitation(householdId: string, inviteeEmail: string) {
    try {
      const { data, error } = await supabase.rpc('create_email_invitation', {
        p_household_id: householdId,
        p_invitee_email: inviteeEmail.toLowerCase().trim(),
        p_expires_in_days: 7,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Get pending invitations for current household
  async getHouseholdInvitations(householdId: string) {
    try {
      const { data, error } = await supabase
        .from('household_email_invites')
        .select(`
          *,
          inviter:inviter_id (
            full_name,
            email
          )
        `)
        .eq('household_id', householdId)
        .order('invited_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Get invitations sent to current user
  async getMyInvitations() {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('household_email_invites')
        .select(`
          *,
          household:household_id (
            name,
            created_by
          ),
          inviter:inviter_id (
            full_name,
            email
          )
        `)
        .eq('invitee_email', profile?.email || '')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Accept email invitation
  async acceptInvitation(inviteId: string) {
    try {
      const { error } = await supabase.rpc('accept_email_invitation', {
        p_invite_id: inviteId,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Reject email invitation
  async rejectInvitation(inviteId: string) {
    try {
      const { error } = await supabase.rpc('reject_email_invitation', {
        p_invite_id: inviteId,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  // Cancel/delete an invitation (by inviter)
  async cancelInvitation(inviteId: string) {
    try {
      const { error } = await supabase
        .from('household_email_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },
};
