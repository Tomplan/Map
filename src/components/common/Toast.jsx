import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Toast notification component
 * Replaces native alert() with a styled, non-blocking notification
 */
function Toast({ message, type, onClose, duration }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  const bgStyle = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white max-w-sm ${bgStyle}`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-lg leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

Toast.defaultProps = {
  type: 'info',
  duration: 5000,
};

export default Toast;
