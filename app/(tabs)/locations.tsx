import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function LocationsScreen() {
  const { colors, theme } = useTheme();
  const items = useInventoryStore((state) => state.items);

  // Group items by storage location
  const locationGroups = items.reduce((acc, item) => {
    if (!acc[item.storageLocation]) {
      acc[item.storageLocation] = [];
    }
    acc[item.storageLocation].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const getLocationIcon = (location: string) => {
    if (location === 'Fridge') return '❄️';
    if (location === 'Freezer') return '🧊';
    if (location === 'Pantry') return '🏪';
    return '📦';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.headerText, { color: colors.text }]}>Storage Locations</Text>
        <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
          View items organized by where they're stored
        </Text>

        {Object.keys(locationGroups).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items in any location yet</Text>
          </View>
        ) : (
          Object.entries(locationGroups).map(([location, locationItems]) => (
            <View key={location} style={[styles.locationCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.locationHeader, { borderBottomColor: colors.border }]}>
                <Text style={styles.locationIcon}>{getLocationIcon(location)}</Text>
                <View style={styles.locationInfo}>
                  <Text style={[styles.locationName, { color: colors.text }]}>{location}</Text>
                  <Text style={[styles.locationCount, { color: colors.textSecondary }]}>
                    {locationItems.length} item{locationItems.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {locationItems.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={[styles.itemDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.itemText, { color: colors.text }]}>
                      {item.productName}
                      {item.brand && (
                        <Text style={[styles.brandText, { color: colors.textTertiary }]}> · {item.brand}</Text>
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Future Features Note */}
        <View style={[styles.featureNote, { backgroundColor: colors.warningBackground, borderLeftColor: colors.warning }]}>
          <Text style={[styles.featureNoteTitle, { color: theme === 'dark' ? colors.warning : '#92400E' }]}>🚧 Coming Soon:</Text>
          <Text style={[styles.featureNoteText, { color: theme === 'dark' ? colors.textSecondary : '#78350F' }]}>
            • Add custom storage locations{'\n'}
            • Customize icons and colors{'\n'}
            • Set default location{'\n'}
            • Organize by folders/shelves
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  locationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  locationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationCount: {
    fontSize: 14,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
  },
  brandText: {
  },
  featureNote: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  featureNoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureNoteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
