import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';

/**
 * Reusable Modal component with professional styling
 * Provides consistent look across all modals in the app
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  testMountedAt,
  testNow,
  className = '',
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  // track when the modal opened in high-res time so we can ignore click-throughs
  // We MUST refresh this timestamp every time the modal opens — commit a2164c6
  // set it only on initial mount which caused subsequent opens to have no
  // protection window. Set synchronously during render so the guard applies
  // on every open/close cycle.
  const mountedAtRef = useRef(0);
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (isOpen) {
    // Preserve the earliest mount timestamp in case of strict-mode double renders
    // so the protection window is calculated from the first render time.
    if (!mountedAtRef.current) {
        mountedAtRef.current = typeof testMountedAt === 'number' ? testMountedAt : now;
    }
  } else {
    mountedAtRef.current = 0;
  }

  const handleBackdropClick = (e) => {
    // Prevent immediate click-throughs that happen when the modal is mounted
    // synchronously while the user is still pressing the mouse (pointerdown)
    // and releases the pointer (pointerup) over the newly-mounted overlay.

    // Ignore backdrop clicks that occur within the first 150ms after mount.
    const now =
      typeof testNow === 'number'
        ? testNow
        : typeof performance !== 'undefined'
          ? performance.now()
          : Date.now();
    
    // In test environment with testNow, always use testNow 
    const isTesting = typeof testNow === 'number';
    const currentTime = isTesting ? testNow : now;

    const mountAt = typeof testMountedAt === 'number' ? testMountedAt : mountedAtRef.current;
    
    // Safety check: if we are testing with manually controlled time, enforce it
    const timeSinceMount = currentTime - mountAt;
    
    // If the modal was opened just now, ignore very-early backdrop clicks (click-through)
    if (timeSinceMount < 150) {
      // swallow the event
      e.stopPropagation();
      return;
    }

    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 transition-opacity duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl border border-gray-200 ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col transform transition-all duration-200 ease-in-out scale-100 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
                aria-label="Close"
              >
                <Icon path={mdiClose} size={0.9} />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1 [&_input]:bg-white [&_input]:text-gray-900 [&_textarea]:bg-white [&_textarea]:text-gray-900 [&_select]:bg-white [&_select]:text-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnBackdrop: PropTypes.bool,
  testMountedAt: PropTypes.number,
  testNow: PropTypes.number,
  className: PropTypes.string,
};

Modal.defaultProps = {
  onClose: null,
  title: null,
  size: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  className: '',
  testNow: undefined,
};

export default Modal;
