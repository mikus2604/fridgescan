import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useInventoryStore, InventoryItem } from '../../src/store/inventoryStore';
import EditItemModal from '../../src/components/EditItemModal';
import UseSomeModal from '../../src/components/UseSomeModal';
import { useTheme } from '../../src/theme/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  const items = useInventoryStore((state) => state.items);
  const getExpiryStatus = useInventoryStore((state) => state.getExpiryStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const recordUsage = useInventoryStore((state) => state.recordUsage);
  const loadData = useInventoryStore((state) => state.loadData);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [useSomeModalVisible, setUseSomeModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [filterExpiry, setFilterExpiry] = useState<'all' | 'expiring' | 'expired' | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }

    // Apply location filter
    if (filterLocation) {
      filtered = filtered.filter((item) => item.storageLocation === filterLocation);
    }

    // Apply expiry filter
    if (filterExpiry === 'expiring') {
      filtered = filtered.filter((item) => {
        const { daysUntilExpiry } = getExpiryStatus(item.bestBeforeDate);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
      });
    } else if (filterExpiry === 'expired') {
      filtered = filtered.filter((item) => {
        const { daysUntilExpiry } = getExpiryStatus(item.bestBeforeDate);
        return daysUntilExpiry < 0;
      });
    }
    // 'all' or null shows all items (no additional filter)

    // Sort by expiry date (soonest first)
    return [...filtered].sort(
      (a, b) => a.bestBeforeDate.getTime() - b.bestBeforeDate.getTime()
    );
  }, [items, searchQuery, filterLocation, filterExpiry, getExpiryStatus]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(items.map((item) => item.storageLocation)));
    return uniqueLocations.sort();
  }, [items]);

  const formatExpiryText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago`;
    } else if (daysUntilExpiry === 0) {
      return 'Expires today!';
    } else if (daysUntilExpiry === 1) {
      return 'Expires tomorrow';
    } else if (daysUntilExpiry <= 7) {
      return `Expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 30) {
      return `Expires in ${Math.ceil(daysUntilExpiry / 7)} weeks`;
    } else {
      return `Expires in ${Math.ceil(daysUntilExpiry / 30)} months`;
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No items yet</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Tap the + button below to add your first item
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search items..."
            placeholderTextColor={colors.textTertiary}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={[styles.clearButton, { backgroundColor: colors.border }]}>
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Location Filter */}
        {locations.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface, borderColor: colors.borderSecondary },
                filterLocation === null && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setFilterLocation(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textSecondary },
                  filterLocation === null && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {locations.map((location) => (
              <Pressable
                key={location}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.surface, borderColor: colors.borderSecondary },
                  filterLocation === location && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setFilterLocation(location)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    filterLocation === location && styles.filterChipTextActive,
                  ]}
                >
                  {location === 'Fridge' ? '❄️' : location === 'Freezer' ? '🧊' : '🏪'} {location}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Summary Stats - Now function as filters */}
        <View style={styles.statsContainer}>
          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.surface },
              filterExpiry === null && styles.statCardActive,
              filterExpiry === null && { borderColor: colors.primary, borderWidth: 2 }
            ]}
            onPress={() => setFilterExpiry(null)}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>All Items</Text>
          </Pressable>
          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.surface },
              filterExpiry === 'expiring' && styles.statCardActive,
              filterExpiry === 'expiring' && { borderColor: '#EF4444', borderWidth: 2 }
            ]}
            onPress={() => setFilterExpiry(filterExpiry === 'expiring' ? null : 'expiring')}
          >
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              {items.filter((item) => {
                const { daysUntilExpiry } = getExpiryStatus(item.bestBeforeDate);
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 3;
              }).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expiring Soon</Text>
          </Pressable>
          <Pressable
            style={[
              styles.statCard,
              { backgroundColor: colors.surface },
              filterExpiry === 'expired' && styles.statCardActive,
              filterExpiry === 'expired' && { borderColor: '#991B1B', borderWidth: 2 }
            ]}
            onPress={() => setFilterExpiry(filterExpiry === 'expired' ? null : 'expired')}
          >
            <Text style={[styles.statNumber, { color: '#991B1B' }]}>
              {items.filter((item) => getExpiryStatus(item.bestBeforeDate).daysUntilExpiry < 0).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expired</Text>
          </Pressable>
        </View>

        {/* Items List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {searchQuery || filterLocation || filterExpiry ? 'Filtered Results' : 'Your Inventory'}
          {(searchQuery || filterLocation || filterExpiry) && (
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}> ({filteredAndSortedItems.length})</Text>
          )}
        </Text>
        {filteredAndSortedItems.length === 0 && (searchQuery || filterLocation || filterExpiry) ? (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>No items found</Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setFilterLocation(null);
                setFilterExpiry(null);
              }}
              style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.clearFiltersText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : null}
        {filteredAndSortedItems.map((item) => {
          const { color, daysUntilExpiry, status } = getExpiryStatus(item.bestBeforeDate);

          return (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface, borderLeftColor: color }]}>
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.productName}</Text>
                  {item.brand && <Text style={[styles.itemBrand, { color: colors.textSecondary }]}>{item.brand}</Text>}
                </View>
                <View style={[styles.locationBadge, { backgroundColor: colors.buttonBackground }]}>
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    {item.storageLocation === 'Fridge' ? '❄️' : '🏪'}{' '}
                    {item.storageLocation}
                  </Text>
                </View>
              </View>

              {/* Item Details */}
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Items:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.itemCount} × {item.quantity} {item.quantityUnit}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Best Before:</Text>
                  <Text style={[styles.expiryText, { color }]}>
                    {formatExpiryText(daysUntilExpiry)}
                  </Text>
                </View>
              </View>

              {/* Expiry Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: color }]}>
                <Text style={styles.statusText}>
                  {status === 'expired'
                    ? '⚠️ EXPIRED'
                    : status === 'critical'
                    ? '🔴 USE TODAY'
                    : status === 'warning'
                    ? '🟡 USE SOON'
                    : status === 'caution'
                    ? '🟢 GOOD'
                    : '✅ FRESH'}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.buttonBackground }]}
                  onPress={() => {
                    setSelectedItem(item);
                    setUseSomeModalVisible(true);
                  }}
                >
                  <Text style={[styles.actionButtonText, { color: colors.text }]}>Use Some</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => {
                    setSelectedItem(item);
                    setEditModalVisible(true);
                  }}
                >
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>
                    Edit
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => removeItem(item.id)}
                >
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Use Some Modal */}
      <UseSomeModal
        visible={useSomeModalVisible}
        item={selectedItem}
        onClose={() => {
          setUseSomeModalVisible(false);
          setSelectedItem(null);
        }}
        onUseSome={(id, newQuantity) => {
          if (selectedItem) {
            const quantityUsed = selectedItem.quantity - newQuantity;
            recordUsage(id, selectedItem.productName, quantityUsed, selectedItem.quantityUnit);

            if (newQuantity === 0) {
              removeItem(id);
            } else {
              updateItem(id, { quantity: newQuantity });
            }
          }
          setUseSomeModalVisible(false);
          setSelectedItem(null);
        }}
      />

      {/* Edit Modal */}
      <EditItemModal
        visible={editModalVisible}
        item={selectedItem}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedItem(null);
        }}
        onSave={(id, updates) => {
          updateItem(id, updates);
          setEditModalVisible(false);
          setSelectedItem(null);
        }}
      />
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
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 40,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultCount: {
    fontWeight: '400',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 16,
    marginBottom: 12,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
  },
  locationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#DBEAFE',
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
