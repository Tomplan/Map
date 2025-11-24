import { useState, useEffect } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import normalizePhone from '../../utils/phone';
import { formatPhoneForDisplay } from '../../utils/formatPhone';

// Country flag emojis
const FLAGS = {
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'GB': '🇬🇧',
  'US': '🇺🇸',
  'ES': '🇪🇸',
  'IT': '🇮🇹',
};

/**
 * PhoneInput - Input field with real-time phone number validation and formatting
 *
 * Features:
 * - Visual feedback (green for valid, red for invalid)
 * - Shows formatted preview (e.g., +31 (0)6-21165748)
 * - Displays country flag
 * - Auto-normalizes to E.164 on blur for storage
 * - Supports default country code (NL)
 *
 * @param {string} value - Current phone value (E.164 format)
 * @param {function} onChange - Callback when value changes
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Additional CSS classes
 * @param {string} defaultCountry - Default country code (default: 'NL')
 */
export default function PhoneInput({
  value = '',
  onChange,
  placeholder = 'Phone number (e.g., +31 (0)6-21165748)',
  className = '',
  defaultCountry = 'NL'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(null); // null = untouched, true = valid, false = invalid
  const [parsedPhone, setParsedPhone] = useState(null);

  // Initialize input with formatted display value
  useEffect(() => {
    if (value && value.trim() !== '') {
      // If we have an E.164 value, format it for display
      const formatted = formatPhoneForDisplay(value);
      setInputValue(formatted);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Validate and parse phone number
  useEffect(() => {
    if (!inputValue || inputValue.trim() === '') {
      setIsValid(null);
      setParsedPhone(null);
      return;
    }

    const trimmed = inputValue.trim();

    // Try to parse with default country
    let parsed = parsePhoneNumberFromString(trimmed, defaultCountry);

    // If that fails, try cleaning and parsing again
    if (!parsed || !parsed.isValid()) {
      // Remove formatting characters but keep + and digits
      let cleaned = trimmed.replace(/[()\s.-]+/g, '');
      if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2);
      parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
    }

    if (parsed && parsed.isValid()) {
      setIsValid(true);
      setParsedPhone(parsed);
    } else {
      setIsValid(false);
      setParsedPhone(null);
    }
  }, [inputValue, defaultCountry]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const handleBlur = () => {
    // Auto-normalize to E.164 on blur for storage
    if (inputValue && inputValue.trim() !== '') {
      const normalized = normalizePhone(inputValue, defaultCountry);
      if (normalized && normalized !== value) {
        // Update parent with E.164 format
        onChange(normalized);
        // Update display with formatted version
        const formatted = formatPhoneForDisplay(normalized);
        setInputValue(formatted);
      }
    } else if (inputValue === '' && value !== '') {
      // Clear the value if input is empty
      onChange('');
    }
  };

  // Determine border color based on validation state
  const getBorderColor = () => {
    if (isValid === null) return 'border-gray-300';
    if (isValid === true) return 'border-green-500';
    if (isValid === false) return 'border-red-500';
    return 'border-gray-300';
  };

  // Determine background color
  const getBackgroundColor = () => {
    if (isValid === null) return 'bg-white';
    if (isValid === true) return 'bg-green-50';
    if (isValid === false) return 'bg-red-50';
    return 'bg-white';
  };

  // Get country flag
  const getFlag = () => {
    if (parsedPhone && parsedPhone.country) {
      return FLAGS[parsedPhone.country] || '🌍';
    }
    return FLAGS[defaultCountry] || '🌍';
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* Country Flag */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-xl">{getFlag()}</span>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full pl-12 pr-3 py-2 border rounded transition-colors ${getBorderColor()} ${getBackgroundColor()} text-gray-900 ${className}`}
        />
      </div>

      {/* Preview/Validation Message */}
      {parsedPhone && isValid && (
        <div className="text-xs mt-1 text-green-600 flex items-center gap-1">
          <span>✓</span>
          <span>{parsedPhone.country || 'International'}</span>
          {parsedPhone.getType() && (
            <span className="text-gray-500">
              ({parsedPhone.getType() === 'MOBILE' ? 'Mobile' : 'Landline'})
            </span>
          )}
        </div>
      )}

      {isValid === false && inputValue && (
        <div className="text-xs mt-1 text-red-600">
          ✗ Invalid phone number
        </div>
      )}

      {!inputValue && (
        <div className="text-xs mt-1 text-gray-500">
          Format: +31 (0)6-12345678
        </div>
      )}
    </div>
  );
}
