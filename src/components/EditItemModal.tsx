import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { InventoryItem } from '../store/inventoryStore';

interface EditItemModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<InventoryItem>) => void;
}

export default function EditItemModal({
  visible,
  item,
  onClose,
  onSave,
}: EditItemModalProps) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('count');
  const [storageLocation, setStorageLocation] = useState('Fridge');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [bestBeforeDate, setBestBeforeDate] = useState(new Date());

  const units = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb'];
  const locations = ['Fridge', 'Pantry', 'Freezer'];

  // Initialize form with item data when modal opens
  useEffect(() => {
    if (item && visible) {
      setProductName(item.productName);
      setBrand(item.brand || '');
      setQuantity(item.quantity.toString());
      setQuantityUnit(item.quantityUnit);
      setStorageLocation(item.storageLocation);
      setPurchaseDate(item.purchaseDate);
      setBestBeforeDate(item.bestBeforeDate);
    }
  }, [item, visible]);

  const handleSave = () => {
    if (!item) return;

    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    onSave(item.id, {
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      quantity: quantityNum,
      quantityUnit,
      storageLocation,
      purchaseDate,
      bestBeforeDate,
    });

    Alert.alert('Success', 'Item updated!');
    onClose();
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const adjustDate = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Product Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g., Milk, Chicken Breast"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Brand */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="Optional"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#9CA3AF"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitSelector}
                >
                  {units.map((unit) => (
                    <Pressable
                      key={unit}
                      style={[
                        styles.unitButton,
                        quantityUnit === unit && styles.unitButtonActive,
                      ]}
                      onPress={() => setQuantityUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          quantityUnit === unit && styles.unitButtonTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Storage Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Storage Location *</Text>
              <View style={styles.locationContainer}>
                {locations.map((location) => (
                  <Pressable
                    key={location}
                    style={[
                      styles.locationButton,
                      storageLocation === location && styles.locationButtonActive,
                    ]}
                    onPress={() => setStorageLocation(location)}
                  >
                    <Text
                      style={[
                        styles.locationButtonText,
                        storageLocation === location &&
                          styles.locationButtonTextActive,
                      ]}
                    >
                      {location === 'Fridge'
                        ? '❄️'
                        : location === 'Freezer'
                        ? '🧊'
                        : '🏪'}{' '}
                      {location}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Purchase Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Purchase Date</Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(purchaseDate)}
                </Text>
                <View style={styles.dateAdjustButtons}>
                  <Pressable
                    style={styles.dateAdjustButton}
                    onPress={() => setPurchaseDate(adjustDate(purchaseDate, -1))}
                  >
                    <Text style={styles.dateAdjustButtonText}>-1d</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateAdjustButton}
                    onPress={() => setPurchaseDate(adjustDate(purchaseDate, 1))}
                  >
                    <Text style={styles.dateAdjustButtonText}>+1d</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.dateAdjustButton, styles.todayButton]}
                    onPress={() => setPurchaseDate(new Date())}
                  >
                    <Text style={styles.dateAdjustButtonText}>Today</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Best Before Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Best Before Date *</Text>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(bestBeforeDate)}
                </Text>
                <View style={styles.dateAdjustButtons}>
                  <Pressable
                    style={styles.dateAdjustButton}
                    onPress={() =>
                      setBestBeforeDate(adjustDate(bestBeforeDate, -1))
                    }
                  >
                    <Text style={styles.dateAdjustButtonText}>-1d</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateAdjustButton}
                    onPress={() =>
                      setBestBeforeDate(adjustDate(bestBeforeDate, 1))
                    }
                  >
                    <Text style={styles.dateAdjustButtonText}>+1d</Text>
                  </Pressable>
                  <Pressable
                    style={styles.dateAdjustButton}
                    onPress={() =>
                      setBestBeforeDate(adjustDate(bestBeforeDate, 7))
                    }
                  >
                    <Text style={styles.dateAdjustButtonText}>+7d</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  quantityContainer: {
    gap: 12,
  },
  quantityInput: {
    marginBottom: 0,
  },
  unitSelector: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  unitButtonActive: {
    backgroundColor: '#10B981',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#10B981',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
  },
  dateContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dateAdjustButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateAdjustButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  dateAdjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
