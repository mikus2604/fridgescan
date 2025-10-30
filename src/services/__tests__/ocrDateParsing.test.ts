/**
 * Test suite for OCR date parsing with alphanumeric dates
 */

import { parseDateFromText } from '../ocrService';
import { cleanOCRText } from '../../utils/digitValidation';

describe('OCR Date Parsing', () => {
  describe('cleanOCRText', () => {
    it('should remove BEST BEFORE prefix', () => {
      const input = 'BEST BEFORE 30NOV25 153098041';
      const cleaned = cleanOCRText(input);
      expect(cleaned).toContain('30NOV25');
      expect(cleaned).not.toContain('BEST BEFORE');
    });

    it('should remove various date prefixes', () => {
      expect(cleanOCRText('EXP: 30NOV25')).toContain('30NOV25');
      expect(cleanOCRText('USE BY 30NOV25')).toContain('30NOV25');
      expect(cleanOCRText('EXPIRY 30NOV25')).toContain('30NOV25');
      expect(cleanOCRText('BB 30NOV25')).toContain('30NOV25');
    });

    it('should replace O with 0 in numeric contexts', () => {
      expect(cleanOCRText('3O')).toBe('30');
      expect(cleanOCRText('O3')).toBe('03');
      expect(cleanOCRText('2O24')).toBe('2024');
    });

    it('should replace l/I with 1 in numeric contexts', () => {
      expect(cleanOCRText('l5')).toBe('15');
      expect(cleanOCRText('I5')).toBe('15');
      expect(cleanOCRText('3l')).toBe('31');
    });
  });

  describe('parseDateFromText', () => {
    it('should parse DDMMMYY format without spaces (30NOV25)', () => {
      const input = '30NOV25';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(30);
      expect(result.date?.getMonth()).toBe(10); // November is month 10 (0-indexed)
      expect(result.date?.getFullYear()).toBe(2025);
    });

    it('should parse DDMMMYYYY format without spaces (25DEC2024)', () => {
      const input = '25DEC2024';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(25);
      expect(result.date?.getMonth()).toBe(11); // December is month 11
      expect(result.date?.getFullYear()).toBe(2024);
    });

    it('should parse DDMMMYY format with spaces (30 NOV 25)', () => {
      const input = '30 NOV 25';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(30);
      expect(result.date?.getMonth()).toBe(10);
      expect(result.date?.getFullYear()).toBe(2025);
    });

    it('should extract date from full text with prefix and suffix', () => {
      const input = 'BEST BEFORE 30NOV25 153098041';
      const cleaned = cleanOCRText(input);
      const result = parseDateFromText(cleaned);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(30);
      expect(result.date?.getMonth()).toBe(10);
      expect(result.date?.getFullYear()).toBe(2025);
    });

    it('should parse various month abbreviations', () => {
      const months = [
        { text: '15JAN25', month: 0 },
        { text: '15FEB25', month: 1 },
        { text: '15MAR25', month: 2 },
        { text: '15APR25', month: 3 },
        { text: '15MAY25', month: 4 },
        { text: '15JUN25', month: 5 },
        { text: '15JUL25', month: 6 },
        { text: '15AUG25', month: 7 },
        { text: '15SEP25', month: 8 },
        { text: '15OCT25', month: 9 },
        { text: '15NOV25', month: 10 },
        { text: '15DEC25', month: 11 },
      ];

      months.forEach(({ text, month }) => {
        const result = parseDateFromText(text);
        expect(result.date).toBeDefined();
        expect(result.date?.getMonth()).toBe(month);
      });
    });

    it('should handle longer month names (NOVEMBER, DECEMBER)', () => {
      const result1 = parseDateFromText('30NOVEMBER25');
      expect(result1.date).toBeDefined();
      expect(result1.date?.getMonth()).toBe(10);

      const result2 = parseDateFromText('25DECEMBER2024');
      expect(result2.date).toBeDefined();
      expect(result2.date?.getMonth()).toBe(11);
    });

    it('should parse DD/MM/YYYY format', () => {
      const input = '30/11/2025';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(30);
      expect(result.date?.getMonth()).toBe(10);
      expect(result.date?.getFullYear()).toBe(2025);
    });

    it('should parse DD-MM-YYYY format', () => {
      const input = '30-11-2025';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(30);
      expect(result.date?.getMonth()).toBe(10);
    });

    it('should only return dates in the future', () => {
      const pastDate = '01/01/2020';
      const result = parseDateFromText(pastDate);

      expect(result.date).toBeUndefined();
    });

    it('should return highest confidence date when multiple dates found', () => {
      // ISO format should have highest confidence
      const input = '2025-11-30 and also 30/11/25';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.confidence).toBeGreaterThan(80);
    });

    it('should handle single digit days and months in alphanumeric format', () => {
      const input = '5JAN25';
      const result = parseDateFromText(input);

      expect(result.date).toBeDefined();
      expect(result.date?.getDate()).toBe(5);
      expect(result.date?.getMonth()).toBe(0);
    });
  });

  describe('Real-world examples', () => {
    it('should parse real barcode expiry date examples', () => {
      const examples = [
        { input: 'BEST BEFORE 30NOV25 153098041', expectedDay: 30, expectedMonth: 10, expectedYear: 2025 },
        { input: 'BB: 15DEC24', expectedDay: 15, expectedMonth: 11, expectedYear: 2024 },
        { input: 'EXP 25JAN2025', expectedDay: 25, expectedMonth: 0, expectedYear: 2025 },
        { input: 'USE BY 31MAR25', expectedDay: 31, expectedMonth: 2, expectedYear: 2025 },
      ];

      examples.forEach(({ input, expectedDay, expectedMonth, expectedYear }) => {
        const cleaned = cleanOCRText(input);
        const result = parseDateFromText(cleaned);

        expect(result.date).toBeDefined();
        expect(result.date?.getDate()).toBe(expectedDay);
        expect(result.date?.getMonth()).toBe(expectedMonth);
        expect(result.date?.getFullYear()).toBe(expectedYear);
      });
    });
  });
});
