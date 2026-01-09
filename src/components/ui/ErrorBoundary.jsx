import React from 'react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF5] flex items-center justify-center p-8">
            <div className="funky-card max-w-lg w-full p-8 text-center border-4 border-red-500 bg-white">
                <h2 className="header-font text-4xl text-red-600 mb-4">Oops! Something went wrong.</h2>
                <p className="body-font-light text-gray-600 text-lg mb-8">
                    An unexpected error occurred. Please try refreshing the page.
                </p>
                <Button
                    onClick={() => window.location.reload()}
                    className="funky-button bg-red-500 hover:bg-red-600 text-white py-4 header-font text-lg"
                >
                    Refresh Page
                </Button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}