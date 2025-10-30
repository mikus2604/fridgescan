import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { extractTextFromImage, formatDate } from '../services/ocrService';
import { useTheme } from '../theme/ThemeContext';
import { cropToRegion } from '../utils/imagePreprocessing';

interface DateScannerProps {
  onDateScanned: (date: Date) => void;
  onClose: () => void;
}

export default function DateScanner({ onDateScanned, onClose }: DateScannerProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);
  const scanFrameRef = useRef<View>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Permission Required</Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            We need access to your camera to scan expiry dates from product labels
          </Text>
          <Pressable style={[styles.permissionButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Process the image URI (not base64)
      await processImageForDate(photo.uri, photo.width, photo.height);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsProcessing(false);
    }
  };

  const processImageForDate = async (imageUri: string, imageWidth: number, imageHeight: number) => {
    try {
      // Get screen dimensions
      const screenWidth = Dimensions.get('window').width;
      const screenHeight = Dimensions.get('window').height;

      // Define scan frame dimensions (must match styles.scanFrame)
      const SCAN_FRAME_WIDTH = 280;
      const SCAN_FRAME_HEIGHT = 160;

      // Calculate the scan frame position on screen (centered horizontally)
      const scanFrameX = (screenWidth - SCAN_FRAME_WIDTH) / 2;

      // The scan frame is vertically centered in the middle section of the overlay
      // We need to account for the header and calculate vertical position
      // Based on the layout: header at top, scanFrame in center, controls at bottom
      // Approximate vertical center position (you may need to adjust based on actual layout)
      const scanFrameY = (screenHeight - SCAN_FRAME_HEIGHT) / 2;

      // Calculate the crop region in image coordinates
      // Map screen coordinates to image coordinates
      const scaleX = imageWidth / screenWidth;
      const scaleY = imageHeight / screenHeight;

      const cropRegion = {
        x: Math.round(scanFrameX * scaleX),
        y: Math.round(scanFrameY * scaleY),
        width: Math.round(SCAN_FRAME_WIDTH * scaleX),
        height: Math.round(SCAN_FRAME_HEIGHT * scaleY),
      };

      console.log('Cropping image to scan frame region:', cropRegion);

      // Crop the image to just the scan frame region
      const croppedImage = await cropToRegion(imageUri, cropRegion);

      // Extract text from the cropped image using OCR
      const result = await extractTextFromImage(croppedImage.uri);

      if (!result.success) {
        Alert.alert(
          'Scan Failed',
          result.error || 'Could not extract text from image. Please try again with better lighting.',
          [
            {
              text: 'Retry',
              onPress: () => setIsProcessing(false),
            },
            {
              text: 'Use Manual Entry',
              onPress: () => onClose(),
              style: 'cancel',
            },
          ]
        );
        return;
      }

      if (!result.date) {
        // No date found, but text was extracted
        Alert.alert(
          'No Date Found',
          `Detected text: "${result.text?.substring(0, 100)}..."\n\nCould not identify a date. Please try again or use manual entry.`,
          [
            {
              text: 'Retry',
              onPress: () => setIsProcessing(false),
            },
            {
              text: 'Manual Entry',
              onPress: () => onClose(),
              style: 'cancel',
            },
          ]
        );
        return;
      }

      // Successfully found a date!
      const confidence = result.confidence || 0;
      Alert.alert(
        'Date Detected!',
        `Found expiry date: ${formatDate(result.date)}\n\nConfidence: ${confidence}%\n\nIs this correct?`,
        [
          {
            text: 'Yes, Use This Date',
            onPress: () => {
              onDateScanned(result.date!);
              onClose();
            },
          },
          {
            text: 'Retry Scan',
            onPress: () => setIsProcessing(false),
            style: 'cancel',
          },
          {
            text: 'Manual Entry',
            onPress: () => onClose(),
          },
        ]
      );
    } catch (error) {
      console.error('OCR Processing Error:', error);
      Alert.alert(
        'Processing Error',
        'An error occurred while processing the image. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => setIsProcessing(false),
          },
          {
            text: 'Cancel',
            onPress: () => onClose(),
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan Expiry Date</Text>
            <Text style={styles.headerSubtitle}>
              Position the best before or use by date within the frame
            </Text>
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />
            <Text style={styles.scanFrameText}>📅 Position date here</Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.processingText}>Processing image...</Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={[styles.captureButton, { borderColor: colors.primary }]}
                  onPress={takePicture}
                  disabled={isProcessing}
                >
                  <View style={[styles.captureButtonInner, { backgroundColor: colors.primary }]} />
                </Pressable>
                <Text style={styles.captureHint}>Tap to capture</Text>
              </>
            )}

            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.danger }]}
              onPress={onClose}
              disabled={isProcessing}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </Pressable>
          </View>

          {/* Tips */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>💡 Tips for best OCR results:</Text>
            <Text style={styles.tipsText}>
              • Ensure good lighting{'\n'}
              • Hold camera steady{'\n'}
              • Get close to the date{'\n'}
              • Avoid glare and shadows{'\n'}
              • Works with: DD/MM/YYYY, YYYY-MM-DD, etc.
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scanFrame: {
    alignSelf: 'center',
    width: 280,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanFrameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    alignItems: 'center',
    gap: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  captureHint: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tips: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
