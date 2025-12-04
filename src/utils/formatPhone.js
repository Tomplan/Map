import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Format phone number for display (e.g., +31 (0)6-21165748)
 * This format includes the national trunk prefix in parentheses
 *
 * @param {string} phoneNumber - E.164 formatted phone number
 * @returns {string} Formatted phone number for display
 */
export function formatPhoneForDisplay(phoneNumber) {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return '';
  }

  const parsed = parsePhoneNumberFromString(phoneNumber);
  if (!parsed || !parsed.isValid()) {
    return phoneNumber; // Return as-is if can't parse
  }

  const countryCode = parsed.countryCallingCode;
  const nationalNumber = parsed.nationalNumber;

  // For Netherlands (and similar countries), format as +31 (0)6-21165748
  if (parsed.country === 'NL') {
    // Dutch mobile numbers start with 6, landline typically 10-99
    const formatted = nationalNumber.replace(/^(\d)(\d{8})$/, '(0)$1-$2');
    return `+${countryCode} ${formatted}`;
  } else if (parsed.country === 'BE') {
    // Belgian format: +32 (0)xxx-xx-xx-xx
    const formatted = nationalNumber.replace(/^(\d{1,3})(\d{2})(\d{2})(\d{2})$/, '(0)$1-$2-$3-$4');
    return `+${countryCode} ${formatted}`;
  } else if (parsed.country === 'DE') {
    // German format: +49 (0)xxx-xxxxxxx
    const formatted = nationalNumber.replace(/^(\d{2,4})(\d+)$/, '(0)$1-$2');
    return `+${countryCode} ${formatted}`;
  }

  // Default format for other countries
  return `+${countryCode} ${nationalNumber}`;
}

/**
 * Get country flag emoji from phone number
 * @param {string} phoneNumber - Phone number to parse
 * @returns {string} Flag emoji or default
 */
export function getPhoneFlag(phoneNumber) {
  const FLAGS = {
    NL: '🇳🇱',
    BE: '🇧🇪',
    DE: '🇩🇪',
    FR: '🇫🇷',
    GB: '🇬🇧',
    US: '🇺🇸',
    ES: '🇪🇸',
    IT: '🇮🇹',
  };

  if (!phoneNumber) return '';

  const parsed = parsePhoneNumberFromString(phoneNumber);
  if (parsed && parsed.country) {
    return FLAGS[parsed.country] || '🌍';
  }
  return '';
}

export default formatPhoneForDisplay;
