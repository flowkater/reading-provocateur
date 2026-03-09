import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught render error:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
            <div className="text-center p-8">
              <h1 className="font-headline text-2xl font-black mb-4">
                문제가 발생했습니다
              </h1>
              <p className="font-body text-[#666] mb-4">
                {this.state.error?.message}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="font-ui px-4 py-2 bg-[#111] text-white"
              >
                다시 시도
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
