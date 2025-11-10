import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: '2rem' }}>
          <h2>Something went wrong in a component.</h2>
          <pre>
            {typeof this.state.error === 'string'
              ? this.state.error
              : JSON.stringify(this.state.error, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div
        style={{
          width: '100%',
          minHeight: '100svh',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {this.props.children}
      </div>
    );
  }
}

export default ErrorBoundary;
