import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error);
    console.error('Component stack:', info?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-400">
          <p className="font-semibold">Something went wrong.</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
