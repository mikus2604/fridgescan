/**
 * Manual test for OCR date parsing improvements
 * Run with: node test-ocr-parsing.js
 */

// Import the functions (simulated for testing)
function cleanOCRText(text) {
  let cleaned = text;

  // First, normalize common date prefixes to make parsing easier
  cleaned = cleaned
    .replace(/BEST\s*BEFORE[:\s]*/gi, '')
    .replace(/USE\s*BY[:\s]*/gi, '')
    .replace(/EXP(?:IRY)?[:\s]*/gi, '')
    .replace(/EXPIRES?[:\s]*/gi, '')
    .replace(/BB[:\s]*/gi, '') // BB is common for "Best Before"
    .replace(/SELL\s*BY[:\s]*/gi, '')
    .replace(/MFG[:\s]*/gi, '') // Manufacturing date
    .replace(/PKD[:\s]*/gi, ''); // Packed date

  // Replace letter O with zero in number contexts
  cleaned = cleaned
    .replace(/(\d)O(\d)/g, '$10$2')
    .replace(/O(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/gi, '0$1$2')
    .replace(/O(\d)/g, '0$1')
    .replace(/(\d)O/g, '$10');

  // Replace letter l/I with 1 in number contexts
  cleaned = cleaned
    .replace(/(\d)[lI](\d)/g, '$11$2')
    .replace(/[lI](\d)/g, '1$1')
    .replace(/(\d)[lI]/g, '$11');

  // Remove extra spaces but preserve single spaces between date components
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

function getMonthFromName(monthName) {
  const months = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  return months[monthName.toUpperCase().substring(0, 3)] ?? 0;
}

function parseDateFromText(text) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  console.log('Parsing text:', cleanText);

  const patterns = [
    // DD/MM/YYYY, DD/MM/YY
    { regex: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g, format: 'DD/MM/YYYY' },
    // YYYY/MM/DD, YYYY-MM-DD
    { regex: /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g, format: 'YYYY/MM/DD' },
    // DDMMMYY or DDMMMYYYY (no spaces, e.g., "30NOV25", "25DEC2024")
    { regex: /(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*(\d{2,4})/gi, format: 'DD MMM YYYY' },
    // DD MMM YYYY, DD MMM YY with spaces (e.g., "25 DEC 2024", "30 NOV 25")
    { regex: /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{2,4})/gi, format: 'DD MMM YYYY' },
  ];

  const potentialDates = [];

  for (const pattern of patterns) {
    const matches = [...cleanText.matchAll(pattern.regex)];

    for (const match of matches) {
      let day, month, year;
      let confidence = 80;

      switch (pattern.format) {
        case 'DD/MM/YYYY':
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          year = parseInt(match[3], 10);
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          confidence = 90;
          break;

        case 'YYYY/MM/DD':
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          day = parseInt(match[3], 10);
          confidence = 95;
          break;

        case 'DD MMM YYYY':
          day = parseInt(match[1], 10);
          month = getMonthFromName(match[2]);
          year = parseInt(match[3], 10);
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
          confidence = 85;
          break;
      }

      // Validate date components
      if (month < 0 || month > 11) continue;
      if (day < 1 || day > 31) continue;
      if (year < 2020 || year > 2050) continue;

      const date = new Date(year, month, day);

      // Check if date is valid
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) {
        continue;
      }

      console.log(`  Found date: ${date.toLocaleDateString()} (confidence: ${confidence}%, format: ${pattern.format})`);
      potentialDates.push({ date, confidence });
    }
  }

  // Filter out dates in the past
  const now = new Date();
  const futureDates = potentialDates.filter(d => d.date > now);

  if (futureDates.length === 0) {
    console.log('  No valid future dates found');
    return { date: undefined, confidence: 0 };
  }

  // Sort by confidence and return the best match
  futureDates.sort((a, b) => b.confidence - a.confidence);

  return {
    date: futureDates[0].date,
    confidence: futureDates[0].confidence,
  };
}

// Test cases
console.log('=== OCR Date Parsing Tests ===\n');

const testCases = [
  'BEST BEFORE 30NOV25 153098041',
  '30NOV25',
  '25DEC2024',
  '30 NOV 25',
  'BB: 15DEC24',
  'EXP 25JAN2025',
  'USE BY 31MAR25',
  '15JANUARY2025',
  '30/11/2025',
  '2025-11-30',
  '5JAN25',
  'BEST BEFORE 3ONOV25', // O instead of 0
];

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase}"`);
  const cleaned = cleanOCRText(testCase);
  console.log('  After cleaning:', cleaned);
  const result = parseDateFromText(cleaned);
  if (result.date) {
    console.log(`  ✅ SUCCESS: ${result.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (${result.confidence}% confidence)`);
  } else {
    console.log('  ❌ FAILED: No date parsed');
  }
});

console.log('\n=== Tests Complete ===');
