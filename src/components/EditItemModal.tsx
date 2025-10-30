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
import DateInputOptions from './DateInputOptions';
import DateScanner from './DateScanner';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [itemCount, setItemCount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('count');
  const [storageLocation, setStorageLocation] = useState('Fridge');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [bestBeforeDate, setBestBeforeDate] = useState(new Date());
  const [showDateScanner, setShowDateScanner] = useState(false);

  const units = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb'];
  const locations = ['Fridge', 'Pantry', 'Freezer'];

  // Initialize form with item data when modal opens
  useEffect(() => {
    if (item && visible) {
      setProductName(item.productName);
      setBrand(item.brand || '');
      setItemCount(item.itemCount.toString());
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

    const itemCountNum = parseInt(itemCount, 10);
    if (isNaN(itemCountNum) || itemCountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid item count');
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
      itemCount: itemCountNum,
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
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Item</Text>
            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.buttonBackground }]}>
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Product Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Product Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={productName}
                onChangeText={setProductName}
                placeholder="e.g., Milk, Chicken Breast"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Brand */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Brand</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={brand}
                onChangeText={setBrand}
                placeholder="Optional"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Item Count */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Number of Items *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                value={itemCount}
                onChangeText={setItemCount}
                placeholder="1"
                keyboardType="number-pad"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity per Item *</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={[styles.input, styles.quantityInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textTertiary}
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
                        { backgroundColor: colors.buttonBackground },
                        quantityUnit === unit && styles.unitButtonActive,
                      ]}
                      onPress={() => setQuantityUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          { color: colors.textSecondary },
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Storage Location *</Text>
              <View style={styles.locationContainer}>
                {locations.map((location) => (
                  <Pressable
                    key={location}
                    style={[
                      styles.locationButton,
                      { backgroundColor: colors.buttonBackground },
                      storageLocation === location && styles.locationButtonActive,
                    ]}
                    onPress={() => setStorageLocation(location)}
                  >
                    <Text
                      style={[
                        styles.locationButtonText,
                        { color: colors.textSecondary },
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Date</Text>
              <View style={[styles.dateContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDateForDisplay(purchaseDate)}
                </Text>
                <View style={styles.dateAdjustButtons}>
                  <Pressable
                    style={[styles.dateAdjustButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setPurchaseDate(adjustDate(purchaseDate, -1))}
                  >
                    <Text style={[styles.dateAdjustButtonText, { color: colors.textSecondary }]}>-1d</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.dateAdjustButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setPurchaseDate(adjustDate(purchaseDate, 1))}
                  >
                    <Text style={[styles.dateAdjustButtonText, { color: colors.textSecondary }]}>+1d</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.dateAdjustButton, styles.todayButton, { borderColor: colors.primary }]}
                    onPress={() => setPurchaseDate(new Date())}
                  >
                    <Text style={[styles.dateAdjustButtonText, { color: colors.textSecondary }]}>Today</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Best Before Date */}
            <DateInputOptions
              initialDate={bestBeforeDate}
              onDateChange={setBestBeforeDate}
              onScanPress={() => setShowDateScanner(true)}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.buttonBackground }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Date Scanner Modal */}
      <Modal
        visible={showDateScanner}
        animationType="slide"
        onRequestClose={() => setShowDateScanner(false)}
      >
        <DateScanner
          onDateScanned={(date) => {
            setBestBeforeDate(date);
            setShowDateScanner(false);
          }}
          onClose={() => setShowDateScanner(false)}
        />
      </Modal>
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
    borderRadius: 8,
    marginRight: 8,
  },
  unitButtonActive: {
    backgroundColor: '#10B981',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonActive: {
    backgroundColor: '#10B981',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
  },
  dateContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateAdjustButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateAdjustButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  todayButton: {
    backgroundColor: '#DBEAFE',
  },
  dateAdjustButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
