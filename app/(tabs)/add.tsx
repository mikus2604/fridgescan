import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { useInventoryStore } from '../../src/store/inventoryStore';
import { useRouter, useFocusEffect } from 'expo-router';
import BarcodeScanner from '../../src/components/BarcodeScanner';
import DateInputOptions from '../../src/components/DateInputOptions';
import DateScanner from '../../src/components/DateScanner';
import { fetchProductByBarcode, parseQuantity } from '../../src/services/barcodeService';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AddItemScreen() {
  const router = useRouter();
  const addItem = useInventoryStore((state) => state.addItem);
  const { colors, theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [itemCount, setItemCount] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('count');
  const [storageLocation, setStorageLocation] = useState('Fridge');
  const [bestBeforeDate, setBestBeforeDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  const [showScanner, setShowScanner] = useState(false);
  const [showDateScanner, setShowDateScanner] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);

  const units = ['count', 'g', 'kg', 'ml', 'L', 'oz', 'lb'];
  const locations = ['Fridge', 'Pantry', 'Freezer'];

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

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

    const itemCountNum = parseInt(itemCount, 10);
    const quantityNum = parseFloat(quantity);

    if (isNaN(itemCountNum) || itemCountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid item count');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!bestBeforeDate || isNaN(bestBeforeDate.getTime())) {
      Alert.alert('Error', 'Please select a valid expiry date');
      return;
    }

    addItem({
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      itemCount: itemCountNum,
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
          setItemCount('1');
          setQuantity('1');
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 7);
          setBestBeforeDate(defaultDate);
          setScannedBarcode(null);
          // Navigate to home
          router.push('/');
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <Text style={[styles.headerText, { color: colors.text }]}>Add New Item</Text>
          <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
            Scan a barcode or enter details manually
          </Text>

          {/* Barcode Scanner Button */}
          <Pressable
            style={[styles.scanButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowScanner(true)}
            disabled={isLoadingProduct}
          >
            <Text style={styles.scanButtonIcon}>📷</Text>
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </Pressable>

          {/* Scanned Barcode Badge */}
          {scannedBarcode && (
            <View style={[styles.barcodeBadge, { backgroundColor: colors.successBackground, borderColor: colors.primary }]}>
              <Text style={[styles.barcodeBadgeText, { color: colors.primaryDark }]}>
                ✓ Barcode: {scannedBarcode}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoadingProduct && (
            <View style={[styles.loadingContainer, { backgroundColor: colors.buttonBackground }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching product info...</Text>
            </View>
          )}

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSecondary }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>Product Details</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSecondary }]} />
          </View>

        {/* Product Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Product Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g., Milk, Chicken Breast, Yogurt"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Brand */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Brand (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g., Organic Valley"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Item Count */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Number of Items *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            value={itemCount}
            onChangeText={setItemCount}
            placeholder="1"
            keyboardType="number-pad"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            How many packages/items? (e.g., 2 bottles, 3 packs)
          </Text>
        </View>

        {/* Quantity */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Quantity per Item *</Text>
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
                    quantityUnit === unit && [styles.unitButtonActive, { backgroundColor: colors.primary }],
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
          <Text style={[styles.label, { color: colors.text }]}>Storage Location *</Text>
          <View style={styles.locationContainer}>
            {locations.map((location) => (
              <Pressable
                key={location}
                style={[
                  styles.locationButton,
                  { backgroundColor: colors.buttonBackground },
                  storageLocation === location && [styles.locationButtonActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setStorageLocation(location)}
              >
                <Text
                  style={[
                    styles.locationButtonText,
                    { color: colors.textSecondary },
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

        {/* Expiry Date Input Options */}
        <DateInputOptions
          initialDate={bestBeforeDate}
          onDateChange={setBestBeforeDate}
          onScanPress={() => setShowDateScanner(true)}
        />

        {/* Add Button */}
        <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>➕ Add to Inventory</Text>
        </Pressable>

        {/* Future Features Note */}
        <View style={[styles.featureNote, { backgroundColor: colors.warningBackground, borderLeftColor: colors.warning }]}>
          <Text style={[styles.featureNoteTitle, { color: theme === 'dark' ? colors.warning : '#92400E' }]}>🚧 Coming Soon:</Text>
          <Text style={[styles.featureNoteText, { color: theme === 'dark' ? colors.textSecondary : '#78350F' }]}>
            • Photo capture for items{'\n'}
            • Custom storage locations{'\n'}
            • AI recipe suggestions{'\n'}
            • Full OCR integration with Google Cloud Vision
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
    </>
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
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationButtonTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
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
  scanButton: {
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  barcodeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
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
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
});
