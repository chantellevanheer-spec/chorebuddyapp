import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundaryWithRetry extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback, level = 'component' } = this.props;
      
      // If custom fallback provided, use it
      if (fallback) {
        return fallback({ 
          error: this.state.error, 
          retry: this.handleRetry,
          retryCount: this.state.retryCount
        });
      }

      // Page-level error (full screen)
      if (level === 'page') {
        return (
          <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-4">
            <div className="funky-card max-w-md w-full p-8 text-center">
              <div className="funky-button w-20 h-20 bg-red-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              
              <h2 className="header-font text-3xl text-[#2B59C3] mb-4">
                Oops! Something went wrong
              </h2>
              
              <p className="body-font-light text-gray-600 mb-6">
                Don't worry, this happens sometimes. Try refreshing or go back home.
              </p>

              {this.state.retryCount < 3 && (
                <p className="body-font text-sm text-gray-500 mb-6">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 funky-button bg-[#2B59C3] text-white"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 funky-button"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level error (inline)
      return (
        <div className="funky-card p-6 bg-red-50 border-red-300">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="body-font text-lg text-red-800 mb-2">
                Something went wrong here
              </h3>
              <p className="body-font-light text-sm text-red-600 mb-4">
                This section couldn't load properly. Try refreshing it.
              </p>
              <Button
                onClick={this.handleRetry}
                size="sm"
                className="funky-button bg-red-600 text-white"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithRetry;