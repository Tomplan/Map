import React from 'react';
import { getLogoPath } from '../../../utils/getLogoPath';

/**
 * Cell for displaying and editing company logos
 */
export function LogoCell({ value, onChange, className = '' }) {
  return (
    <td className={`py-1 px-3 border-b text-left ${className}`}>
      <div className="flex items-center gap-2">
        {value && (
          <img
            src={getLogoPath(value)}
            alt="Logo"
            className="w-8 h-8 object-contain border border-gray-300 rounded"
          />
        )}
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white border rounded px-2 py-1"
          placeholder="Logo filename"
        />
      </div>
    </td>
  );
}
