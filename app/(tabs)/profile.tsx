import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const items = useInventoryStore((state) => state.items);
  const getExpiryStatus = useInventoryStore((state) => state.getExpiryStatus);
  const { theme, colors, toggleTheme } = useTheme();
  const { user, profile, signOut, currentHousehold } = useAuth();

  // Calculate statistics
  const totalItems = items.length;
  const expiredItems = items.filter(
    (item) => getExpiryStatus(item.bestBeforeDate).status === 'expired'
  ).length;
  const criticalItems = items.filter(
    (item) => getExpiryStatus(item.bestBeforeDate).status === 'critical'
  ).length;
  const warningItems = items.filter(
    (item) => getExpiryStatus(item.bestBeforeDate).status === 'warning'
  ).length;

  // Handle sign out
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  // Get user display name and email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const displayEmail = user?.email || 'No email';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displayEmail}</Text>
          {currentHousehold && (
            <View style={[styles.householdBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.householdText, { color: colors.textSecondary }]}>
                🏠 {currentHousehold.name}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Statistics</Text>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Items</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalItems}</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expired Items</Text>
              <Text style={[styles.statValue, { color: colors.statusExpired }]}>
                {expiredItems}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Critical (1-3 days)</Text>
              <Text style={[styles.statValue, { color: colors.statusCritical }]}>
                {criticalItems}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Warning (4-7 days)</Text>
              <Text style={[styles.statValue, { color: colors.statusWarning }]}>
                {warningItems}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings (Placeholder) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

          {/* Dark Mode Toggle */}
          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {theme === 'dark' ? '🌙' : '☀️'} Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              </Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.buttonBackground, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <Pressable style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>🔔 Notifications</Text>
            <Text style={[styles.settingArrow, { color: colors.textTertiary }]}>›</Text>
          </Pressable>

          <Pressable style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>👥 Household</Text>
            <Text style={[styles.settingArrow, { color: colors.textTertiary }]}>›</Text>
          </Pressable>

          <Pressable style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>⚙️ Preferences</Text>
            <Text style={[styles.settingArrow, { color: colors.textTertiary }]}>›</Text>
          </Pressable>

          <Pressable style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>❓ Help & Support</Text>
            <Text style={[styles.settingArrow, { color: colors.textTertiary }]}>›</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>FridgeScan MVP</Text>
            <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>Version 0.1.0</Text>
            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              Cross-platform inventory management app for tracking food items and
              reducing food waste.
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <Pressable
            style={[styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.error }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.signOutText, { color: colors.error }]}>🚪 Sign Out</Text>
          </Pressable>
        </View>

        {/* Future Features Note */}
        <View style={[styles.featureNote, { backgroundColor: colors.warningBackground, borderLeftColor: colors.warning }]}>
          <Text style={[styles.featureNoteTitle, { color: theme === 'dark' ? colors.warning : '#92400E' }]}>🚧 Coming Soon:</Text>
          <Text style={[styles.featureNoteText, { color: theme === 'dark' ? colors.textSecondary : '#78350F' }]}>
            • Push notifications for expiry alerts{'\n'}
            • Advanced household collaboration{'\n'}
            • Usage analytics dashboard{'\n'}
            • Recipe suggestions{'\n'}
            • Export data and reports
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  settingArrow: {
    fontSize: 24,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  featureNote: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  featureNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  featureNoteText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  householdBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  householdText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
