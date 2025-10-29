import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { useInventoryStore, InventoryItem } from '../../src/store/inventoryStore';
import EditItemModal from '../../src/components/EditItemModal';
import UseSomeModal from '../../src/components/UseSomeModal';

export default function HomeScreen() {
  const items = useInventoryStore((state) => state.items);
  const getExpiryStatus = useInventoryStore((state) => state.getExpiryStatus);
  const removeItem = useInventoryStore((state) => state.removeItem);
  const updateItem = useInventoryStore((state) => state.updateItem);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [useSomeModalVisible, setUseSomeModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Sort items by expiry date (soonest first)
  const sortedItems = [...items].sort(
    (a, b) => a.bestBeforeDate.getTime() - b.bestBeforeDate.getTime()
  );

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>No items yet</Text>
        <Text style={styles.emptyText}>
          Tap the + button below to add your first item
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>
              {items.filter((item) => getExpiryStatus(item.bestBeforeDate).daysUntilExpiry <= 3).length}
            </Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
        </View>

        {/* Items List */}
        <Text style={styles.sectionTitle}>Your Inventory</Text>
        {sortedItems.map((item) => {
          const { color, daysUntilExpiry, status } = getExpiryStatus(item.bestBeforeDate);

          return (
            <View key={item.id} style={[styles.itemCard, { borderLeftColor: color }]}>
              {/* Item Header */}
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
                </View>
                <View style={styles.locationBadge}>
                  <Text style={styles.locationText}>
                    {item.storageLocation === 'Fridge' ? '❄️' : '🏪'}{' '}
                    {item.storageLocation}
                  </Text>
                </View>
              </View>

              {/* Item Details */}
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>
                    {item.quantity} {item.quantityUnit}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Best Before:</Text>
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
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedItem(item);
                    setUseSomeModalVisible(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Use Some</Text>
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
          if (newQuantity === 0) {
            removeItem(id);
          } else {
            updateItem(id, { quantity: newQuantity });
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
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationText: {
    fontSize: 12,
    color: '#4B5563',
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
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
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
    color: '#4B5563',
  },
});
