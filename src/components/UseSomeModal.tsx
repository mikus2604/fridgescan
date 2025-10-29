import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { InventoryItem } from '../store/inventoryStore';

interface UseSomeModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUseSome: (id: string, newQuantity: number) => void;
}

export default function UseSomeModal({
  visible,
  item,
  onClose,
  onUseSome,
}: UseSomeModalProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [selectedFraction, setSelectedFraction] = useState<string | null>(null);

  const fractions = [
    { label: '1/4', value: 0.25 },
    { label: '1/3', value: 0.33 },
    { label: '1/2', value: 0.5 },
    { label: '2/3', value: 0.67 },
    { label: '3/4', value: 0.75 },
    { label: 'All', value: 1.0 },
  ];

  const handleUseFraction = (fraction: number, label: string) => {
    if (!item) return;

    const amountToUse = item.quantity * fraction;
    const newQuantity = Math.max(0, item.quantity - amountToUse);

    if (newQuantity === 0) {
      Alert.alert(
        'Remove Item?',
        'This will use all remaining quantity. Do you want to remove this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              onUseSome(item.id, 0);
              resetAndClose();
            },
          },
        ]
      );
    } else {
      onUseSome(item.id, newQuantity);
      Alert.alert(
        'Success',
        `Used ${label} (${amountToUse.toFixed(2)} ${item.quantityUnit}). ${newQuantity.toFixed(2)} ${item.quantityUnit} remaining.`
      );
      resetAndClose();
    }
  };

  const handleUseCustomAmount = () => {
    if (!item) return;

    const amountToUse = parseFloat(customAmount);
    if (isNaN(amountToUse) || amountToUse <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amountToUse > item.quantity) {
      Alert.alert('Error', `You only have ${item.quantity} ${item.quantityUnit} available`);
      return;
    }

    const newQuantity = Math.max(0, item.quantity - amountToUse);

    if (newQuantity === 0) {
      Alert.alert(
        'Remove Item?',
        'This will use all remaining quantity. Do you want to remove this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              onUseSome(item.id, 0);
              resetAndClose();
            },
          },
        ]
      );
    } else {
      onUseSome(item.id, newQuantity);
      Alert.alert(
        'Success',
        `Used ${amountToUse} ${item.quantityUnit}. ${newQuantity.toFixed(2)} ${item.quantityUnit} remaining.`
      );
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setCustomAmount('');
    setSelectedFraction(null);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={resetAndClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Use Some</Text>
            <Pressable onPress={resetAndClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Item Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.currentQuantity}>
              Current: {item.quantity} {item.quantityUnit}
            </Text>
          </View>

          {/* Quick Fractions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.fractionsContainer}>
              {fractions.map((fraction) => (
                <Pressable
                  key={fraction.label}
                  style={[
                    styles.fractionButton,
                    selectedFraction === fraction.label && styles.fractionButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedFraction(fraction.label);
                    setCustomAmount('');
                    handleUseFraction(fraction.value, fraction.label);
                  }}
                >
                  <Text
                    style={[
                      styles.fractionButtonText,
                      selectedFraction === fraction.label && styles.fractionButtonTextActive,
                    ]}
                  >
                    {fraction.label}
                  </Text>
                  <Text style={styles.fractionAmount}>
                    {(item.quantity * fraction.value).toFixed(1)} {item.quantityUnit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Custom Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Or Enter Custom Amount</Text>
            <View style={styles.customAmountContainer}>
              <TextInput
                style={styles.input}
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedFraction(null);
                }}
                placeholder={`e.g., ${(item.quantity / 2).toFixed(0)}`}
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.unitLabel}>{item.quantityUnit}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={resetAndClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                styles.confirmButton,
                !customAmount && styles.confirmButtonDisabled,
              ]}
              onPress={handleUseCustomAmount}
              disabled={!customAmount}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  !customAmount && styles.confirmButtonTextDisabled,
                ]}
              >
                Use Amount
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  itemInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  currentQuantity: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  fractionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fractionButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fractionButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  fractionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  fractionButtonTextActive: {
    color: '#FFFFFF',
  },
  fractionAmount: {
    fontSize: 12,
    color: '#6B7280',
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
  confirmButton: {
    backgroundColor: '#10B981',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
