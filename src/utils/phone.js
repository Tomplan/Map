import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Normalize a phone number string to E.164 format where possible.
 * Falls back to the original trimmed string when parsing fails.
 *
 * @param {string|null|undefined} phone
 * @param {string} defaultCountry - ISO 3166-1 alpha-2 country code to assume for local numbers (default: 'NL')
 * @returns {string|null} E.164 formatted phone number or original trimmed value or null
 */
export function normalizePhone(phone, defaultCountry = 'NL') {
  if (!phone && phone !== '') return null;
  const raw = String(phone).trim();
  if (raw === '') return null;

  // Try parsing with default country (useful for local numbers without +)
  let parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (parsed && parsed.isValid()) {
    return parsed.format('E.164');
  }

  // Attempt a cleaned parse (strip non-digit except leading + and convert 00 prefix)
  let cleaned = raw.replace(/[()\s.-]+/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
  parsed = parsePhoneNumberFromString(cleaned);
  if (parsed && parsed.isValid()) {
    return parsed.format('E.164');
  }

  // If all parsing fails, try to return only digits (as a last resort) so storage is predictable
  const digitsOnly = raw.replace(/[^0-9+]+/g, '');
  return digitsOnly || raw;
}

export default normalizePhone;
