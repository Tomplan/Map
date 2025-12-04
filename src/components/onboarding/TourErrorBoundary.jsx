import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import { mdiAlertCircle, mdiRefresh, mdiClose } from '@mdi/js';

/**
 * TourErrorBoundary
 * 
 * Catches and handles errors that occur during tour initialization and execution.
 * Provides user-friendly error messages and recovery options.
 */
export default class TourErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Tour Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Trigger a retry if a retry callback was provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleDismiss = () => {
    // Trigger a dismiss callback if provided
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
  };

  render() {
    if (this.state.hasError) {
      return <TourErrorFallback 
        error={this.state.error}
        onRetry={this.handleRetry}
        onDismiss={this.handleDismiss}
      />;
    }

    return this.props.children;
  }
}

TourErrorBoundary.propTypes = {
  children: PropTypes.node,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
};

/**
 * TourErrorFallback
 * 
 * User-friendly error display component for tour failures.
 */
function TourErrorFallback({ error, onRetry, onDismiss }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Icon path={mdiAlertCircle} size={1.5} className="text-red-500 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('tour.error.title', 'Tour Temporarily Unavailable')}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          {t('tour.error.message', 'We encountered an issue starting the interactive tour. This can happen due to browser compatibility or temporary technical issues.')}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <Icon path={mdiClose} size={0.8} />
            {t('common.cancel', 'Cancel')}
          </button>
          
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Icon path={mdiRefresh} size={0.8} />
            {t('common.retry', 'Try Again')}
          </button>
        </div>
      </div>
    </div>
  );
}

TourErrorFallback.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};