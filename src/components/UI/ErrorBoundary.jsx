import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './index';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 my-6 text-center glass rounded-2xl border border-destructive/30 bg-destructive/5 animate-fade-in">
          <div className="p-3 mb-3 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-base font-semibold text-fg mb-1">
            {this.props.title || 'Unable to display this view'}
          </h3>
          <p className="text-xs text-fg-muted max-w-md mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred. The received data structure might differ from what was expected.'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
