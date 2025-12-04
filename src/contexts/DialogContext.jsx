import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';

const DialogContext = createContext(null);

/**
 * Provider for global dialog and toast management
 * Wrap your app with this to use useConfirm and useToast hooks
 */
export function DialogProvider({ children }) {
  // Confirm dialog state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: null,
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    resolve: null,
  });

  // Toast state
  const [toasts, setToasts] = useState([]);

  // Show confirm dialog and return a promise
  const confirm = useCallback(({ title, message, confirmText, cancelText, variant } = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: title || null,
        message: message || '',
        confirmText: confirmText || 'Confirm',
        cancelText: cancelText || 'Cancel',
        variant: variant || 'default',
        resolve,
      });
    });
  }, []);

  // Handle confirm dialog actions
  const handleConfirm = useCallback(() => {
    confirmState.resolve?.(true);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState.resolve]);

  const handleCancel = useCallback(() => {
    confirmState.resolve?.(false);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  }, [confirmState.resolve]);

  // Show toast notification
  const toast = useCallback(({ message, type = 'info', duration = 5000 } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  // Shorthand toast methods
  const toastSuccess = useCallback(
    (message, duration) => toast({ message, type: 'success', duration }),
    [toast],
  );

  const toastError = useCallback(
    (message, duration) => toast({ message, type: 'error', duration }),
    [toast],
  );

  const toastWarning = useCallback(
    (message, duration) => toast({ message, type: 'warning', duration }),
    [toast],
  );

  const toastInfo = useCallback(
    (message, duration) => toast({ message, type: 'info', duration }),
    [toast],
  );

  // Remove toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    confirm,
    toast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </DialogContext.Provider>
  );
}

DialogProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access dialog context
 * Returns { confirm, toast, toastSuccess, toastError, toastWarning, toastInfo }
 */
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

export default DialogContext;
