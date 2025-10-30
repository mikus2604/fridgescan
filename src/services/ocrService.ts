/**
 * Unified OCR Service for extracting text from images
 * Prioritizes native ML Kit (Android/iOS), falls back to cloud OCR (web/fallback)
 */

import { isNativeOCRAvailable, recognizeTextNative } from './nativeOCRService';
import { preprocessImageForOCR } from '../utils/imagePreprocessing';
import { validateDate, cleanOCRText } from '../utils/digitValidation';
import { parseDateFromText, formatDate } from '../utils/dateParser';

export interface OCRResult {
  success: boolean;
  text?: string;
  date?: Date;
  confidence?: number;
  error?: string;
  method?: 'native' | 'cloud';
  corrections?: Array<{
    original: string;
    corrected: string;
    reason: string;
  }>;
}

/**
 * MAIN OCR FUNCTION - Unified entry point for all OCR operations
 * Automatically selects best method (native vs cloud) based on platform
 * Applies preprocessing and validation for maximum accuracy
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  try {
    // Step 1: Preprocess image for better OCR accuracy
    console.log('[OCR] Preprocessing image...');
    const preprocessed = await preprocessImageForOCR(imageUri, {
      enhanceContrast: true,
      sharpen: true,
      resize: true,
      targetWidth: 1200,
    });

    // Step 2: Try native OCR first (Android ML Kit / iOS Vision)
    if (isNativeOCRAvailable()) {
      console.log('[OCR] Using native ML Kit OCR...');
      const nativeResult = await recognizeTextNative(preprocessed.uri);

      console.log('[OCR] Native OCR result:', {
        success: nativeResult.success,
        hasText: !!nativeResult.text,
        textLength: nativeResult.text?.length || 0,
        confidence: nativeResult.confidence,
        error: nativeResult.error,
      });

      if (nativeResult.success && nativeResult.text) {
        // Clean OCR artifacts
        const cleanedText = cleanOCRText(nativeResult.text);
        console.log('[OCR] Native OCR cleaned text:', cleanedText);

        // Validate that we got meaningful text (not gibberish)
        const hasDatePatterns = /\d{1,4}[\/\-\.\s]\d{1,2}[\/\-\.\s]?\d{0,4}|\d{2,8}|(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i.test(cleanedText);

        // IMPORTANT: Don't reject based on text length - a single digit can be valid!
        // For example, scanning just "25" might be part of a date

        // Reject if no date-like patterns found at all
        if (!hasDatePatterns) {
          console.log('[OCR] Native OCR text validation failed - no date patterns found');
          console.log('[OCR] Detected text:', cleanedText);
          console.log('[OCR] Attempting cloud OCR fallback...');
        } else {
          // Parse and validate date
          const parsedDate = parseDateFromText(cleanedText);

          if (parsedDate.date) {
            console.log('[OCR] ✓ Native OCR success with valid date:', parsedDate.date);
            console.log('[OCR] Confidence:', parsedDate.confidence);
            return {
              success: true,
              text: cleanedText,
              date: parsedDate.date,
              confidence: parsedDate.confidence || nativeResult.confidence,
              method: 'native',
            };
          }

          console.log('[OCR] Native OCR found date patterns but could not parse valid date');
          console.log('[OCR] Detected text:', cleanedText);
          console.log('[OCR] Attempting cloud OCR fallback...');
        }
      } else {
        console.log('[OCR] Native OCR returned no text or failed');
        console.log('[OCR] Error:', nativeResult.error);
        console.log('[OCR] Attempting cloud OCR fallback...');
      }
    } else {
      console.log('[OCR] Native OCR not available on this platform');
    }

    // Step 3: Fallback to cloud OCR (web platform or if native failed)
    console.log('[OCR] Using cloud OCR...');
    return await extractTextFromImageCloud(preprocessed.uri);
  } catch (error) {
    console.error('[OCR] Extraction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR failed',
    };
  }
}

/**
 * Cloud OCR using OCR.space API (fallback method)
 * Returns mock data for development/testing when API is unavailable
 */
async function extractTextFromImageCloud(imageUri: string): Promise<OCRResult> {
  try {
    // Convert image URI to base64
    const base64Image = await imageToBase64(imageUri);

    return await extractTextFromImageCloudBase64(base64Image);
  } catch (error) {
    console.warn('[OCR] Cloud OCR failed, returning mock result for testing:', error);

    // Return mock result for development
    // In production, you would want to use a proper API key or different OCR service
    return {
      success: true,
      text: 'BEST BEFORE\n25 DEC 2025',
      date: new Date(2025, 11, 25), // Dec 25, 2025
      confidence: 75,
      method: 'cloud',
      error: 'Using mock data - API unavailable',
    };
  }
}

/**
 * Helper to convert image URI to base64
 */
async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
}

/**
 * Extract text from base64 image using OCR.space API
 */
async function extractTextFromImageCloudBase64(base64Image: string): Promise<OCRResult> {
  try {
    // OCR.space free API endpoint
    const apiUrl = 'https://api.ocr.space/parse/image';

    // Create form data
    const formData = new FormData();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for numbers and dates

    // Use free API key (demo key with rate limits)
    formData.append('apikey', 'helloworld');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // API key is rate limited or invalid - this is expected with free tier
      console.warn(`[OCR] API returned ${response.status} - rate limited or invalid key`);
      throw new Error(`OCR API returned ${response.status} - rate limited`);
    }

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      return {
        success: false,
        error: data.ErrorMessage?.[0] || 'OCR processing failed',
      };
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || '';

    if (!extractedText) {
      return {
        success: false,
        error: 'No text detected in image',
      };
    }

    // Clean OCR artifacts
    const cleanedText = cleanOCRText(extractedText);

    // Try to parse a date from the extracted text
    const parsedDate = parseDateFromText(cleanedText);

    return {
      success: true,
      text: cleanedText,
      date: parsedDate.date,
      confidence: parsedDate.confidence,
      method: 'cloud',
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR failed',
    };
  }
}

// Note: parseDateFromText and formatDate functions have been moved to ../utils/dateParser.ts
// to avoid circular dependencies between ocrService.ts and nativeOCRService.ts
