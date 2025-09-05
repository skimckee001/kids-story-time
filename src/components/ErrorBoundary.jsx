import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught error:', error);
    console.error('Error info:', errorInfo);
    
    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          maxWidth: '600px',
          margin: '50px auto'
        }}>
          <h2 style={{ color: '#e74c3c' }}>Something went wrong</h2>
          <p style={{ marginTop: '20px', color: '#666' }}>
            We're sorry, but something unexpected happened. 
          </p>
          {this.state.error && (
            <details style={{ 
              marginTop: '30px', 
              textAlign: 'left',
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error details (for developers)
              </summary>
              <pre style={{ 
                marginTop: '10px',
                fontSize: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px',
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;