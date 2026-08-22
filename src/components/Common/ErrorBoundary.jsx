import React from 'react';

export default class ErrorBoundary extends React.Component {
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
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary, #aaa)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
            Something went wrong
          </h3>
          <p style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
