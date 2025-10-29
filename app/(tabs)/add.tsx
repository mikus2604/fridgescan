import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useRouter } from 'expo-router';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useInventoryStore((state) => state.addItem);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('count');
  const [storageLocation, setStorageLocation] = useState('Fridge');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState('7');

  const units = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb'];
  const locations = ['Fridge', 'Pantry', 'Freezer'];

  const handleAddItem = () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const daysNum = parseInt(daysUntilExpiry, 10);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (isNaN(daysNum) || daysNum < 0) {
      Alert.alert('Error', 'Please enter valid days until expiry');
      return;
    }

    const bestBeforeDate = new Date();
    bestBeforeDate.setDate(bestBeforeDate.getDate() + daysNum);

    addItem({
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      quantity: quantityNum,
      quantityUnit,
      bestBeforeDate,
      purchaseDate: new Date(),
      storageLocation,
    });

    Alert.alert('Success', 'Item added to inventory!', [
      {
        text: 'OK',
        onPress: () => {
          // Reset form
          setProductName('');
          setBrand('');
          setQuantity('1');
          setDaysUntilExpiry('7');
          // Navigate to home
          router.push('/');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerText}>Add New Item</Text>
        <Text style={styles.subHeaderText}>
          Fill in the details below. Later, you'll be able to scan barcodes and use OCR!
        </Text>

        {/* Product Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g., Milk, Chicken Breast, Yogurt"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Brand */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand (Optional)</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Organic Valley"
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
                    storageLocation === location && styles.locationButtonTextActive,
                  ]}
                >
                  {location === 'Fridge' ? '❄️' : location === 'Freezer' ? '🧊' : '🏪'}{' '}
                  {location}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Days Until Expiry */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Days Until Expiry *</Text>
          <TextInput
            style={styles.input}
            value={daysUntilExpiry}
            onChangeText={setDaysUntilExpiry}
            placeholder="7"
            keyboardType="number-pad"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.helperText}>
            How many days from today until this item expires
          </Text>
        </View>

        {/* Add Button */}
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>➕ Add to Inventory</Text>
        </Pressable>

        {/* Future Features Note */}
        <View style={styles.featureNote}>
          <Text style={styles.featureNoteTitle}>🚧 Coming Soon:</Text>
          <Text style={styles.featureNoteText}>
            • Barcode scanning for automatic product info{'\n'}
            • OCR for automatic expiry date detection{'\n'}
            • Photo capture for items{'\n'}
            • Custom storage locations
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
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
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
    backgroundColor: '#FFFFFF',
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
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureNote: {
    marginTop: 24,
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
