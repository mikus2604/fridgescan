import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export type DateInputMethod = 'days' | 'manual' | 'scan';

interface DateInputOptionsProps {
  initialDate?: Date;
  onDateChange: (date: Date) => void;
  onScanPress?: () => void;
}

export default function DateInputOptions({
  initialDate = new Date(),
  onDateChange,
  onScanPress,
}: DateInputOptionsProps) {
  const [selectedMethod, setSelectedMethod] = useState<DateInputMethod>('days');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState('7');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleMethodSelect = (method: DateInputMethod) => {
    setSelectedMethod(method);

    // When switching methods, ensure we emit a valid date
    if (method === 'days') {
      const days = parseInt(daysUntilExpiry, 10) || 7;
      const date = new Date();
      date.setDate(date.getDate() + days);
      onDateChange(date);
    } else if (method === 'manual') {
      onDateChange(selectedDate);
    } else if (method === 'scan' && onScanPress) {
      onScanPress();
    }
  };

  const handleDaysChange = (text: string) => {
    setDaysUntilExpiry(text);
    const days = parseInt(text, 10);
    if (!isNaN(days) && days >= 0) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      onDateChange(date);
    }
  };

  const handleDatePickerChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      onDateChange(date);
    }
  };

  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Best Before Date *</Text>
      <Text style={styles.helperText}>Choose your preferred input method:</Text>

      {/* Scan Date Button - Prominent Style */}
      <Pressable
        style={styles.scanButton}
        onPress={() => handleMethodSelect('scan')}
      >
        <Text style={styles.scanButtonIcon}>📷</Text>
        <Text style={styles.scanButtonText}>Scan Date</Text>
      </Pressable>

      {/* Method Selection Buttons */}
      <View style={styles.methodSelector}>
        <Pressable
          style={[
            styles.methodButton,
            selectedMethod === 'manual' && styles.methodButtonActive,
          ]}
          onPress={() => handleMethodSelect('manual')}
        >
          <Text style={styles.methodIcon}>📅</Text>
          <Text
            style={[
              styles.methodButtonText,
              selectedMethod === 'manual' && styles.methodButtonTextActive,
            ]}
          >
            Pick Date
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.methodButton,
            selectedMethod === 'days' && styles.methodButtonActive,
          ]}
          onPress={() => handleMethodSelect('days')}
        >
          <Text style={styles.methodIcon}>⏱️</Text>
          <Text
            style={[
              styles.methodButtonText,
              selectedMethod === 'days' && styles.methodButtonTextActive,
            ]}
          >
            Add Days
          </Text>
        </Pressable>
      </View>

      {/* Input Area Based on Selected Method */}
      <View style={styles.inputArea}>
        {selectedMethod === 'days' && (
          <View>
            <Text style={styles.inputLabel}>Days Until Expiry:</Text>
            <TextInput
              style={styles.input}
              value={daysUntilExpiry}
              onChangeText={handleDaysChange}
              placeholder="7"
              keyboardType="number-pad"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.inputHelperText}>
              How many days from today until this item expires
            </Text>
          </View>
        )}

        {selectedMethod === 'manual' && (
          <View>
            <Text style={styles.inputLabel}>Select Expiry Date:</Text>

            {Platform.OS === 'web' ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDatePickerChange}
                minimumDate={new Date()}
                style={styles.datePickerWeb}
              />
            ) : (
              <>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                  <Text style={styles.dateButtonIcon}>📅</Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDatePickerChange}
                    minimumDate={new Date()}
                  />
                )}

                {Platform.OS === 'ios' && showDatePicker && (
                  <Pressable
                    style={styles.doneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </Pressable>
                )}
              </>
            )}
            <Text style={styles.inputHelperText}>
              Select the best before or use by date from the calendar
            </Text>
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
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
  methodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  methodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  methodButtonTextActive: {
    color: '#065F46',
  },
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  inputHelperText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  datePickerWeb: {
    marginBottom: 8,
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanInstructions: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scanInstructionsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanInstructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  scanInstructionsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  scanInstructionsNote: {
    fontSize: 12,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    textAlign: 'center',
  },
});
