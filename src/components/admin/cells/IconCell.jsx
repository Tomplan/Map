import React from 'react';
import { getIconPath } from '../../../utils/getIconPath';

/**
 * Cell for displaying and selecting marker icons
 */
export function IconCell({ value, markerId, onIconClick }) {
  return (
    <td
      className="py-1 px-3 border-b text-left cursor-pointer hover:bg-gray-50"
      style={{ minWidth: 40, width: 40, maxWidth: 40 }}
      onClick={() => onIconClick(markerId)}
      title="Click to change icon"
    >
      {value && (
        <img src={getIconPath(value)} alt="Icon" style={{ width: 24, height: 24 }} />
      )}
    </td>
  );
}

/**
 * Icon selector modal/popover component
 */
export function IconSelectorModal({ isOpen, onClose, onSelect, options, currentValue }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Select Icon</h3>
        <div className="grid grid-cols-4 gap-4">
          {options.map((iconFile) => {
            const iconPath = getIconPath(iconFile);
            const isSelected = currentValue === iconFile;

            return (
              <button
                key={iconFile}
                onClick={() => {
                  onSelect(iconFile);
                  onClose();
                }}
                className={`p-3 rounded border-2 hover:border-blue-500 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                title={iconFile}
              >
                <img src={iconPath} alt={iconFile} className="w-full h-auto" />
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
