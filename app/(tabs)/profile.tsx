import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useInventoryStore } from '../../src/store/inventoryStore';

export default function ProfileScreen() {
  const items = useInventoryStore((state) => state.items);
  const getExpiryStatus = useInventoryStore((state) => state.getExpiryStatus);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>Demo User</Text>
          <Text style={styles.userEmail}>demo@fridgescan.app</Text>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Items</Text>
              <Text style={styles.statValue}>{totalItems}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Expired Items</Text>
              <Text style={[styles.statValue, { color: '#991B1B' }]}>
                {expiredItems}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Critical (1-3 days)</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {criticalItems}
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Warning (4-7 days)</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {warningItems}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>🔔 Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>👥 Household</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>⚙️ Preferences</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>❓ Help & Support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </Pressable>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>FridgeScan MVP</Text>
            <Text style={styles.aboutVersion}>Version 0.1.0</Text>
            <Text style={styles.aboutDescription}>
              Cross-platform inventory management app for tracking food items and
              reducing food waste.
            </Text>
          </View>
        </View>

        {/* Future Features Note */}
        <View style={styles.featureNote}>
          <Text style={styles.featureNoteTitle}>🚧 Coming Soon:</Text>
          <Text style={styles.featureNoteText}>
            • User authentication (sign up/login){'\n'}
            • Push notifications for expiry alerts{'\n'}
            • Household sharing and collaboration{'\n'}
            • Analytics and insights dashboard{'\n'}
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  settingArrow: {
    fontSize: 24,
    color: '#9CA3AF',
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
});
