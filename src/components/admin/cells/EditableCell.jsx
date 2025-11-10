import React from 'react';

/**
 * Generic editable cell component for text/number inputs
 */
export function EditableCell({ value, onChange, type = 'text', className = '' }) {
  return (
    <td className={`py-1 px-3 border-b text-left ${className}`}>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        className="w-full bg-white border rounded px-2 py-1"
      />
    </td>
  );
}

/**
 * Editable textarea cell for longer text
 */
export function TextareaCell({ value, onChange, className = '' }) {
  return (
    <td className={`py-1 px-3 border-b text-left ${className}`}>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border rounded px-2 py-1 min-h-[60px]"
      />
    </td>
  );
}

/**
 * Editable cell for boolean values (checkbox)
 */
export function BooleanCell({ value, onChange, className = '' }) {
  return (
    <td className={`py-1 px-3 border-b text-center ${className}`}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
    </td>
  );
}

/**
 * Editable cell for array values
 */
export function ArrayCell({ value, onChange, className = '' }) {
  const displayValue = Array.isArray(value) ? value.join(', ') : '';

  return (
    <td className={`py-1 px-3 border-b text-left ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          const arr = e.target.value.split(',').map((v) => v.trim());
          onChange(arr);
        }}
        className="w-full bg-white border rounded px-2 py-1"
      />
    </td>
  );
}

/**
 * Read-only cell for displaying values
 */
export function ReadOnlyCell({ value, className = '', title = '' }) {
  let displayValue = value;

  if (Array.isArray(value)) {
    displayValue = value.join(', ');
  } else if (typeof value === 'object' && value !== null) {
    displayValue = JSON.stringify(value);
  } else if (typeof value === 'boolean') {
    displayValue = value ? '✓' : '✗';
  }

  return (
    <td className={`py-1 px-3 border-b text-left bg-gray-100 ${className}`} title={title}>
      {displayValue ?? ''}
    </td>
  );
}
