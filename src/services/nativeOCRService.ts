/**
 * Native OCR Service for Android ML Kit and iOS Vision
 * Provides platform-specific text recognition with high accuracy
 */

import { Platform } from 'react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { OCRResult } from './ocrService';
import { parseDateFromText } from './ocrService';

export interface NativeOCROptions {
  preprocessed?: boolean;
  language?: string;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface NativeOCRResult extends OCRResult {
  blocks?: TextBlock[];
  rawText?: string;
  processingTime?: number;
}

/**
 * Check if native OCR is available on this platform
 */
export function isNativeOCRAvailable(): boolean {
  // Native OCR is available on Android and iOS only
  // Not available on web
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }

  // Check if the ML Kit module is actually linked
  try {
    return TextRecognition && typeof TextRecognition.recognize === 'function';
  } catch {
    return false;
  }
}

/**
 * Perform native OCR using ML Kit (Android) or Vision (iOS)
 * Returns high-accuracy text recognition results
 */
export async function recognizeTextNative(
  imageUri: string,
  options: NativeOCROptions = {}
): Promise<NativeOCRResult> {
  const startTime = Date.now();

  try {
    if (!isNativeOCRAvailable()) {
      console.log('[Native OCR] Not available on this platform');
      return {
        success: false,
        error: 'Native OCR not available on this platform',
      };
    }

    console.log('[Native OCR] Starting text recognition on image:', imageUri);

    // Use ML Kit Text Recognition
    const result = await TextRecognition.recognize(imageUri);

    const processingTime = Date.now() - startTime;

    console.log('[Native OCR] Recognition completed in', processingTime, 'ms');
    console.log('[Native OCR] Result:', {
      hasText: !!result?.text,
      textLength: result?.text?.length || 0,
      blockCount: result?.blocks?.length || 0,
    });

    if (!result) {
      console.warn('[Native OCR] ML Kit returned null/undefined result');
      return {
        success: false,
        error: 'OCR engine returned no result',
        processingTime,
      };
    }

    if (!result.text || result.text.trim() === '') {
      console.warn('[Native OCR] No text detected in image');
      console.log('[Native OCR] Block count:', result.blocks?.length || 0);
      return {
        success: false,
        error: 'No text detected in image',
        processingTime,
      };
    }

    console.log('[Native OCR] ✓ Raw text detected:', result.text);
    console.log('[Native OCR] Processing time:', processingTime, 'ms');

    // Extract text blocks with confidence scores
    const blocks: TextBlock[] = (result.blocks || []).map((block) => {
      const confidence = block.recognizedLanguages?.[0]?.confidence || 0.85;
      console.log('[Native OCR] Block text:', block.text, '| confidence:', confidence);

      return {
        text: block.text,
        confidence,
        boundingBox: block.frame
          ? {
              x: block.frame.x,
              y: block.frame.y,
              width: block.frame.width,
              height: block.frame.height,
            }
          : undefined,
      };
    });

    console.log('[Native OCR] Total blocks extracted:', blocks.length);

    // Parse date from the extracted text
    const parsedDate = parseDateFromText(result.text);

    console.log('[Native OCR] Date parsing result:', {
      hasDate: !!parsedDate.date,
      date: parsedDate.date,
      confidence: parsedDate.confidence,
    });

    // Calculate overall confidence based on blocks
    const avgConfidence =
      blocks.length > 0
        ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
        : 0.8;

    return {
      success: true,
      text: result.text,
      rawText: result.text,
      blocks,
      date: parsedDate.date,
      confidence: parsedDate.confidence || avgConfidence * 100,
      processingTime,
    };
  } catch (error) {
    console.error('[Native OCR] Recognition error:', error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error('[Native OCR] Error name:', error.name);
      console.error('[Native OCR] Error message:', error.message);
      console.error('[Native OCR] Error stack:', error.stack);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR recognition failed',
      processingTime,
    };
  }
}

/**
 * Extract numbers from recognized text blocks
 * Useful for focusing on date-like patterns
 */
export function extractNumberBlocks(blocks: TextBlock[]): TextBlock[] {
  return blocks.filter((block) => {
    // Check if block contains mostly numbers, slashes, or dashes
    const numberPattern = /[\d\/\-\.]/g;
    const matches = block.text.match(numberPattern);
    const numberRatio = matches ? matches.length / block.text.length : 0;

    // Block should be at least 50% numbers/date characters
    return numberRatio >= 0.5;
  });
}

/**
 * Find the most likely date block based on confidence and position
 * Food expiry dates are typically in specific locations
 */
export function findMostLikelyDateBlock(blocks: TextBlock[]): TextBlock | null {
  const numberBlocks = extractNumberBlocks(blocks);

  if (numberBlocks.length === 0) {
    return null;
  }

  // Sort by confidence, prefer blocks with higher confidence
  numberBlocks.sort((a, b) => b.confidence - a.confidence);

  return numberBlocks[0];
}

/**
 * Validate recognized text quality
 * Returns true if the OCR result is reliable enough
 */
export function validateOCRQuality(result: NativeOCRResult): boolean {
  if (!result.success || !result.text) {
    return false;
  }

  // Check minimum confidence threshold
  if (result.confidence && result.confidence < 60) {
    return false;
  }

  // Check if text contains any date-like patterns
  const datePattern = /\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]?\d{0,4}|\d{2,8}/;
  if (!datePattern.test(result.text)) {
    return false;
  }

  return true;
}

/**
 * Get detailed OCR metrics for debugging
 */
export interface OCRMetrics {
  platform: string;
  processingTime: number;
  blockCount: number;
  avgConfidence: number;
  hasDate: boolean;
  textLength: number;
}

export function getOCRMetrics(result: NativeOCRResult): OCRMetrics {
  const blocks = result.blocks || [];
  const avgConfidence =
    blocks.length > 0
      ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
      : 0;

  return {
    platform: Platform.OS,
    processingTime: result.processingTime || 0,
    blockCount: blocks.length,
    avgConfidence: avgConfidence * 100,
    hasDate: !!result.date,
    textLength: result.text?.length || 0,
  };
}
