import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useState } from 'react';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useRouter } from 'expo-router';
import BarcodeScanner from '../../src/components/BarcodeScanner';
import { fetchProductByBarcode, parseQuantity } from '../../src/services/barcodeService';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useInventoryStore((state) => state.addItem);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('count');
  const [storageLocation, setStorageLocation] = useState('Fridge');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState('7');

  const [showScanner, setShowScanner] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const units = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb'];
  const locations = ['Fridge', 'Pantry', 'Freezer'];

  const handleBarcodeScanned = async (barcode: string) => {
    setShowScanner(false);
    setScannedBarcode(barcode);
    setIsLoadingProduct(true);

    try {
      const productData = await fetchProductByBarcode(barcode);

      if (productData) {
        // Populate form with product data
        setProductName(productData.productName);
        if (productData.brand) setBrand(productData.brand);

        // Parse quantity if available
        if (productData.quantity) {
          const { quantity: qty, unit } = parseQuantity(productData.quantity);
          setQuantity(qty.toString());
          setQuantityUnit(unit);
        }

        Alert.alert(
          'Product Found!',
          `${productData.productName}${productData.brand ? ' by ' + productData.brand : ''}\n\nPlease review and adjust the details.`
        );
      } else {
        Alert.alert(
          'Product Not Found',
          `Barcode ${barcode} was not found in the database. Please enter the product details manually.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product information. Please enter details manually.');
    } finally {
      setIsLoadingProduct(false);
    }
  };

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
      barcode: scannedBarcode || undefined,
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
          setScannedBarcode(null);
          // Navigate to home
          router.push('/');
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.headerText}>Add New Item</Text>
          <Text style={styles.subHeaderText}>
            Scan a barcode or enter details manually
          </Text>

          {/* Barcode Scanner Button */}
          <Pressable
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
            disabled={isLoadingProduct}
          >
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </Pressable>

          {/* Scanned Barcode Badge */}
          {scannedBarcode && (
            <View style={styles.barcodeBadge}>
              <Text style={styles.barcodeBadgeText}>
                ✓ Barcode: {scannedBarcode}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoadingProduct && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Fetching product info...</Text>
            </View>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Product Details</Text>
            <View style={styles.dividerLine} />
          </View>

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
            • OCR for automatic expiry date detection{'\n'}
            • Photo capture for items{'\n'}
            • Custom storage locations{'\n'}
            • AI recipe suggestions
          </Text>
        </View>
      </View>
    </ScrollView>

    {/* Barcode Scanner Modal */}
    <Modal
      visible={showScanner}
      animationType="slide"
      onRequestClose={() => setShowScanner(false)}
    >
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />
    </Modal>
    </>
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
  scanButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  barcodeBadge: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  barcodeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 12,
  },
});
