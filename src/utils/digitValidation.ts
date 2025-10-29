/**
 * Digit Validation and Correction Utilities
 * Handles common OCR digit misrecognition (0↔9, 3↔8, etc.)
 */

export interface DigitCorrection {
  original: string;
  corrected: string;
  confidence: number;
  reason: string;
}

/**
 * Common digit confusions in OCR
 * Based on visual similarity
 */
const COMMON_DIGIT_CONFUSIONS: { [key: string]: string[] } = {
  '0': ['O', '9', 'D'],
  '1': ['l', 'I', '7'],
  '2': ['Z'],
  '3': ['8', '9', 'B'],
  '4': ['A'],
  '5': ['S', '6'],
  '6': ['G', '5'],
  '7': ['1', 'T'],
  '8': ['B', '3', '9'],
  '9': ['g', '0', '3', '8'],
};

/**
 * Validate and correct month value
 * Months must be 01-12
 */
export function validateAndCorrectMonth(
  monthStr: string,
  confidence?: number
): DigitCorrection | null {
  const month = parseInt(monthStr, 10);

  // Valid month, no correction needed
  if (month >= 1 && month <= 12) {
    return null;
  }

  // Common corrections for invalid months
  const corrections: DigitCorrection[] = [];

  // If month is 00, likely should be 09 or 08
  if (monthStr === '00') {
    corrections.push({
      original: '00',
      corrected: '09',
      confidence: 70,
      reason: '00 is invalid, likely 09 (0↔9 confusion)',
    });
  }

  // If month is 03 but confidence is low, might be 09
  if (monthStr === '03' && confidence && confidence < 80) {
    corrections.push({
      original: '03',
      corrected: '09',
      confidence: 60,
      reason: 'Low confidence on 03, could be 09 (0↔9 confusion)',
    });
  }

  // If month is 13-19, likely first digit should be 0
  if (month >= 13 && month <= 19) {
    const corrected = '0' + monthStr[1];
    corrections.push({
      original: monthStr,
      corrected,
      confidence: 85,
      reason: `${month} is invalid, likely ${corrected} (1 recognized as first digit)`,
    });
  }

  // If month is 20-29, likely should be 10-12 or 00-09
  if (month >= 20 && month <= 29) {
    // Check second digit
    const secondDigit = monthStr[1];
    if (['0', '1', '2'].includes(secondDigit)) {
      const corrected = '1' + secondDigit;
      corrections.push({
        original: monthStr,
        corrected,
        confidence: 75,
        reason: `${month} is invalid, likely ${corrected} (2↔1 confusion)`,
      });
    }
  }

  // If month is 30-39, likely should be 00-09
  if (month >= 30 && month <= 39) {
    const corrected = '0' + monthStr[1];
    corrections.push({
      original: monthStr,
      corrected,
      confidence: 80,
      reason: `${month} is invalid, likely ${corrected} (3↔0 confusion)`,
    });
  }

  // Return best correction
  if (corrections.length > 0) {
    corrections.sort((a, b) => b.confidence - a.confidence);
    return corrections[0];
  }

  return null;
}

/**
 * Validate and correct day value
 * Days must be 01-31
 */
export function validateAndCorrectDay(
  dayStr: string,
  confidence?: number
): DigitCorrection | null {
  const day = parseInt(dayStr, 10);

  // Valid day, no correction needed
  if (day >= 1 && day <= 31) {
    return null;
  }

  const corrections: DigitCorrection[] = [];

  // If day is 00, likely should be 08 or 09
  if (dayStr === '00') {
    corrections.push({
      original: '00',
      corrected: '09',
      confidence: 65,
      reason: '00 is invalid, likely 09 (0↔9 confusion)',
    });
  }

  // If day is 32-39, first digit likely wrong
  if (day >= 32 && day <= 39) {
    // 3 might be 2 or 0
    corrections.push({
      original: dayStr,
      corrected: '2' + dayStr[1],
      confidence: 75,
      reason: `${day} is invalid, likely 2${dayStr[1]} (3↔2 confusion)`,
    });
    corrections.push({
      original: dayStr,
      corrected: '0' + dayStr[1],
      confidence: 70,
      reason: `${day} is invalid, could be 0${dayStr[1]} (3↔0 confusion)`,
    });
  }

  // Return best correction
  if (corrections.length > 0) {
    corrections.sort((a, b) => b.confidence - a.confidence);
    return corrections[0];
  }

  return null;
}

/**
 * Validate and correct year value
 * Years should be 2024-2035 for food expiry dates
 */
export function validateAndCorrectYear(
  yearStr: string,
  confidence?: number
): DigitCorrection | null {
  let year = parseInt(yearStr, 10);

  // Handle 2-digit years
  if (yearStr.length === 2) {
    year = 2000 + year;
  }

  // Valid year range for food expiry
  if (year >= 2024 && year <= 2035) {
    return null;
  }

  const corrections: DigitCorrection[] = [];

  // If year is in the past or far future, try corrections
  if (year < 2024 || year > 2035) {
    // Check for digit confusion in 4-digit year
    if (yearStr.length === 4) {
      // 3024 → 2024 (3↔2 confusion)
      if (yearStr.startsWith('3')) {
        corrections.push({
          original: yearStr,
          corrected: '2' + yearStr.substring(1),
          confidence: 85,
          reason: 'Year starts with 3, likely 2 (3↔2 confusion)',
        });
      }

      // 2O24 → 2024 (O↔0 confusion)
      const corrected = yearStr.replace(/O/g, '0').replace(/o/g, '0');
      if (corrected !== yearStr) {
        corrections.push({
          original: yearStr,
          corrected,
          confidence: 90,
          reason: 'Letter O detected, corrected to 0',
        });
      }
    }
  }

  if (corrections.length > 0) {
    corrections.sort((a, b) => b.confidence - a.confidence);
    return corrections[0];
  }

  return null;
}

/**
 * Validate entire date and suggest corrections
 */
export interface DateValidation {
  isValid: boolean;
  corrections: DigitCorrection[];
  suggestedDate?: Date;
  confidence: number;
}

export function validateDate(
  dateComponents: {
    day?: string;
    month?: string;
    year?: string;
  },
  overallConfidence?: number
): DateValidation {
  const corrections: DigitCorrection[] = [];
  let confidence = overallConfidence || 100;

  // Validate month
  if (dateComponents.month) {
    const monthCorrection = validateAndCorrectMonth(
      dateComponents.month,
      overallConfidence
    );
    if (monthCorrection) {
      corrections.push(monthCorrection);
      dateComponents.month = monthCorrection.corrected;
      confidence = Math.min(confidence, monthCorrection.confidence);
    }
  }

  // Validate day
  if (dateComponents.day) {
    const dayCorrection = validateAndCorrectDay(
      dateComponents.day,
      overallConfidence
    );
    if (dayCorrection) {
      corrections.push(dayCorrection);
      dateComponents.day = dayCorrection.corrected;
      confidence = Math.min(confidence, dayCorrection.confidence);
    }
  }

  // Validate year
  if (dateComponents.year) {
    const yearCorrection = validateAndCorrectYear(
      dateComponents.year,
      overallConfidence
    );
    if (yearCorrection) {
      corrections.push(yearCorrection);
      dateComponents.year = yearCorrection.corrected;
      confidence = Math.min(confidence, yearCorrection.confidence);
    }
  }

  // Try to construct date
  let suggestedDate: Date | undefined;
  let isValid = false;

  if (dateComponents.year && dateComponents.month) {
    const year = parseInt(dateComponents.year, 10);
    const month = parseInt(dateComponents.month, 10) - 1;
    const day = dateComponents.day ? parseInt(dateComponents.day, 10) : 1;

    const date = new Date(year, month, day);

    // Check if date is valid and in the future
    if (
      !isNaN(date.getTime()) &&
      date > new Date() &&
      date.getFullYear() === year &&
      date.getMonth() === month
    ) {
      suggestedDate = date;
      isValid = true;
    }
  }

  return {
    isValid,
    corrections,
    suggestedDate,
    confidence,
  };
}

/**
 * Clean text to remove common OCR artifacts
 */
export function cleanOCRText(text: string): string {
  return (
    text
      // Replace letter O with zero in number contexts
      .replace(/(\d)O(\d)/g, '$10$2')
      .replace(/O(\d)/g, '0$1')
      .replace(/(\d)O/g, '$10')
      // Replace letter l/I with 1 in number contexts
      .replace(/(\d)[lI](\d)/g, '$11$2')
      .replace(/[lI](\d)/g, '1$1')
      .replace(/(\d)[lI]/g, '$11')
      // Remove spaces in dates
      .replace(/(\d)\s+(\d)/g, '$1$2')
      // Normalize separators
      .replace(/[\/\-\.]/g, '/')
  );
}
