import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { householdService } from '../services/household.service';

interface Invitation {
  id: string;
  household_id: string;
  invitee_email: string;
  status: string;
  invited_at: string;
  expires_at: string;
  household: {
    name: string;
  };
  inviter: {
    full_name: string | null;
    email: string | null;
  };
}

interface PendingInvitesCardProps {
  onInviteAccepted?: () => void;
}

export default function PendingInvitesCard({ onInviteAccepted }: PendingInvitesCardProps) {
  const { colors, theme } = useTheme();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await householdService.getMyInvitations();
      if (error) {
        console.error('Error loading invitations:', error);
      } else if (data) {
        setInvitations(data as any);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId: string, householdName: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await householdService.acceptInvitation(inviteId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to accept invitation');
      } else {
        Alert.alert('Success', `You've joined ${householdName}!`);
        loadInvitations();
        onInviteAccepted?.();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    Alert.alert('Reject Invitation', 'Are you sure you want to reject this invitation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(inviteId);
          try {
            const { error } = await householdService.rejectInvitation(inviteId);
            if (error) {
              Alert.alert('Error', 'Failed to reject invitation');
            } else {
              loadInvitations();
            }
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Invitations</Text>
      {invitations.map((invite) => (
        <View key={invite.id} style={[styles.inviteCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.inviteInfo}>
            <Text style={[styles.inviteTitle, { color: colors.text }]}>
              Invitation to {invite.household?.name || 'Unknown Household'}
            </Text>
            <Text style={[styles.inviteSubtitle, { color: colors.textSecondary }]}>
              From {invite.inviter?.full_name || invite.inviter?.email || 'Unknown'}
            </Text>
            <Text style={[styles.inviteDate, { color: colors.textTertiary }]}>
              Invited {new Date(invite.invited_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.inviteActions}>
            <Pressable
              style={[
                styles.actionButton,
                styles.acceptButton,
                { backgroundColor: colors.primary },
                actionLoading === invite.id && styles.actionButtonDisabled,
              ]}
              onPress={() => handleAccept(invite.id, invite.household?.name || 'this household')}
              disabled={actionLoading === invite.id}
            >
              {actionLoading === invite.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept</Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.rejectButton,
                { borderColor: colors.error },
                actionLoading === invite.id && styles.actionButtonDisabled,
              ]}
              onPress={() => handleReject(invite.id)}
              disabled={actionLoading === invite.id}
            >
              <Text style={[styles.rejectButtonText, { color: colors.error }]}>Decline</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  inviteInfo: {
    marginBottom: 12,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  inviteDate: {
    fontSize: 12,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
