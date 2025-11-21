import React from 'react';
import PropTypes from 'prop-types';

/**
 * Reusable confirmation dialog component
 * Replaces native confirm() with a styled, accessible modal
 */
function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    default: 'bg-blue-600 hover:bg-blue-700',
  };

  const buttonStyle = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-gray-900 mb-2"
          >
            {title}
          </h2>
        )}
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md transition-colors ${buttonStyle}`}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'danger', 'warning']),
};

ConfirmDialog.defaultProps = {
  title: null,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
};

export default ConfirmDialog;
