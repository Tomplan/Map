import React from 'react';
import { getIconPath } from '../../../utils/getIconPath';
import Modal from '../../common/Modal';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Icon"
      size="md"
    >
      <div className="p-6">
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
    </Modal>
  );
}
