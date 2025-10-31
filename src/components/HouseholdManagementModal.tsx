import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { householdService } from '../services/household.service';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  };
}

interface Invitation {
  id: string;
  invitee_email: string;
  status: string;
  invited_at: string;
  expires_at: string;
  inviter: {
    full_name: string | null;
    email: string | null;
  };
}

interface HouseholdManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HouseholdManagementModal({
  visible,
  onClose,
}: HouseholdManagementModalProps) {
  const { colors } = useTheme();
  const { currentHousehold, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Fetch members and invitations
  useEffect(() => {
    if (visible && currentHousehold) {
      loadData();
    }
  }, [visible, currentHousehold]);

  const loadData = async () => {
    if (!currentHousehold) return;

    setLoading(true);
    try {
      // Fetch members
      const { data: membersData, error: membersError } = await householdService.getHouseholdMembers(
        currentHousehold.id
      );

      if (membersError) {
        console.error('Error fetching members:', membersError);
      } else if (membersData) {
        setMembers(membersData as any);
      }

      // Fetch invitations
      const { data: invitationsData, error: invitationsError } =
        await householdService.getHouseholdInvitations(currentHousehold.id);

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
      } else if (invitationsData) {
        setInvitations(invitationsData as any);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!currentHousehold) return;

    setSendingInvite(true);
    try {
      const { error } = await householdService.sendEmailInvitation(
        currentHousehold.id,
        inviteEmail.trim()
      );

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send invitation');
      } else {
        Alert.alert(
          'Success',
          `Invitation sent to ${inviteEmail.trim()}. They will receive an email to join your household.`
        );
        setInviteEmail('');
        loadData(); // Reload to show new invitation
      }
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (inviteId: string, email: string) => {
    Alert.alert('Cancel Invitation', `Cancel invitation to ${email}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          const { error } = await householdService.cancelInvitation(inviteId);
          if (error) {
            Alert.alert('Error', 'Failed to cancel invitation');
          } else {
            loadData();
          }
        },
      },
    ]);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert('Remove Member', `Remove ${memberName} from household?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const { error } = await householdService.removeMember(memberId);
          if (error) {
            Alert.alert('Error', 'Failed to remove member');
          } else {
            loadData();
          }
        },
      },
    ]);
  };

  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isOwnerOrAdmin = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Household Management</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Household Info */}
          {currentHousehold && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.householdName, { color: colors.text }]}>
                {currentHousehold.name}
              </Text>
            </View>
          )}

          {/* Invite Member Section */}
          {isOwnerOrAdmin && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Invite Family Member
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Enter the email address of the person you want to invite. They will receive an email
                with instructions to join your household.
              </Text>

              <View style={styles.inviteForm}>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  placeholder="family.member@example.com"
                  placeholderTextColor={colors.textTertiary}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={[
                    styles.inviteButton,
                    { backgroundColor: colors.primary },
                    sendingInvite && styles.inviteButtonDisabled,
                  ]}
                  onPress={handleSendInvite}
                  disabled={sendingInvite}
                >
                  {sendingInvite ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.inviteButtonText}>Send Invite</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Pending Invitations */}
          {isOwnerOrAdmin && invitations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pending Invitations
              </Text>
              {invitations
                .filter((inv) => inv.status === 'pending')
                .map((invite) => (
                  <View
                    key={invite.id}
                    style={[styles.memberCard, { backgroundColor: colors.surface }]}
                  >
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {invite.invitee_email}
                      </Text>
                      <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                        Invited {new Date(invite.invited_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleCancelInvite(invite.id, invite.invitee_email)}
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>Cancel</Text>
                    </Pressable>
                  </View>
                ))}
            </View>
          )}

          {/* Members List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Members</Text>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              members.map((member) => (
                <View
                  key={member.id}
                  style={[styles.memberCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.profiles?.full_name || 'Unknown'}
                      {member.user_id === user?.id && ' (You)'}
                    </Text>
                    <Text style={[styles.memberRole, { color: colors.textSecondary }]}>
                      {member.profiles?.email} • {member.role}
                    </Text>
                  </View>
                  {isOwnerOrAdmin && member.user_id !== user?.id && member.role !== 'owner' && (
                    <Pressable
                      onPress={() =>
                        handleRemoveMember(member.id, member.profiles?.full_name || 'this member')
                      }
                      style={styles.actionButton}
                    >
                      <Text style={[styles.actionButtonText, { color: colors.error }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Info Section */}
          <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              When you invite someone, they'll receive an email with a link to accept the invitation.
              If they already have an account, they'll be added immediately. If not, they can create
              an account and will automatically join your household.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  householdName: {
    fontSize: 24,
    fontWeight: '700',
    padding: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  inviteForm: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inviteButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
