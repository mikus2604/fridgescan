/**
 * Date parsing utilities for OCR text
 * Extracted to avoid circular dependencies between ocrService and nativeOCRService
 */

interface ParsedDate {
  date: Date | undefined;
  confidence: number;
}

/**
 * Parse date from extracted OCR text
 * Supports multiple date formats commonly found on food packaging
 */
export function parseDateFromText(text: string): ParsedDate {
  // Clean up text: remove extra whitespace and newlines
  const cleanText = text.replace(/\s+/g, ' ').trim();

  console.log('OCR Text:', cleanText);

  // Common date patterns on food packaging
  const patterns = [
    // YYYY/MM/DD, YYYY-MM-DD (ISO format - try first for highest confidence)
    { regex: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g, format: 'YYYY/MM/DD' },
    // DD/MM/YYYY, DD/MM/YY
    { regex: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g, format: 'DD/MM/YYYY' },
    // DDMMMYY or DDMMMYYYY (no spaces, e.g., "30NOV25", "25DEC2024")
    { regex: /(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*(\d{2,4})/gi, format: 'DD MMM YYYY' },
    // DD MMM YYYY, DD MMM YY with spaces (e.g., "25 DEC 2024", "30 NOV 25")
    { regex: /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{2,4})/gi, format: 'DD MMM YYYY' },
    // MMM DD YYYY (e.g., "DEC 25 2024")
    { regex: /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s*(\d{1,2})[,\s]+(\d{2,4})/gi, format: 'MMM DD YYYY' },
    // YYYYMMDD (8 digits, no separators)
    { regex: /\b(20\d{2})(\d{2})(\d{2})\b/g, format: 'YYYYMMDD' },
    // DDMMYYYY, DDMMYY (6-8 digits, no separators) - try last due to ambiguity
    { regex: /\b(\d{2})(\d{2})(\d{2,4})\b/g, format: 'DDMMYYYY' },
  ];

  const potentialDates: { date: Date; confidence: number }[] = [];

  for (const pattern of patterns) {
    const matches = [...cleanText.matchAll(pattern.regex)];

    for (const match of matches) {
      const parsedDate = parseMatchedDate(match, pattern.format);
      if (parsedDate) {
        potentialDates.push(parsedDate);
      }
    }
  }

  // Filter out dates in the past (expiry dates should be in the future)
  const now = new Date();
  const futureDates = potentialDates.filter(d => d.date > now);

  if (futureDates.length === 0) {
    return { date: undefined, confidence: 0 };
  }

  // Sort by confidence and return the best match
  futureDates.sort((a, b) => b.confidence - a.confidence);

  return {
    date: futureDates[0].date,
    confidence: futureDates[0].confidence,
  };
}

function parseMatchedDate(match: RegExpMatchArray, format: string): { date: Date; confidence: number } | null {
  try {
    let day: number, month: number, year: number;
    let confidence = 80; // Base confidence

    switch (format) {
      case 'DD/MM/YYYY':
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        year = parseInt(match[3], 10);
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        confidence = 90; // High confidence for standard format
        break;

      case 'YYYY/MM/DD':
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
        confidence = 95; // Very high confidence for ISO format
        break;

      case 'DD MMM YYYY':
        day = parseInt(match[1], 10);
        month = getMonthFromName(match[2]);
        year = parseInt(match[3], 10);
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        confidence = 85; // Good confidence for text month
        break;

      case 'MMM DD YYYY':
        month = getMonthFromName(match[1]);
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        confidence = 85;
        break;

      case 'DDMMYYYY':
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        confidence = 70; // Lower confidence without separators
        break;

      case 'YYYYMMDD':
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
        confidence = 85;
        break;

      default:
        return null;
    }

    // Validate date components
    if (month < 0 || month > 11) return null;
    if (day < 1 || day > 31) return null;
    if (year < 2020 || year > 2050) return null; // Reasonable range for food expiry

    const date = new Date(year, month, day);

    // Check if date is valid (e.g., Feb 30 would be invalid)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return { date, confidence };
  } catch (error) {
    return null;
  }
}

function getMonthFromName(monthName: string): number {
  const months: { [key: string]: number } = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  return months[monthName.toUpperCase().substring(0, 3)] ?? 0;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
