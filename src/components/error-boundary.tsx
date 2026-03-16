import * as Sentry from "@sentry/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error?: Error;
  hasError: boolean;
}

/**
 * Error Boundary Component
 *
 * Catches React errors, logs them to Sentry, and displays a fallback UI.
 * Provides a "Try Again" button to reset the error state.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to Sentry with component stack
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error("Error Boundary caught an error:", error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ error: undefined, hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg bg-content1 p-8 text-center shadow-lg">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h2>
            </div>
            <p className="mb-6 text-default-500">
              An unexpected error occurred. Please try again or refresh the
              page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 rounded bg-danger-50 p-4 text-left">
                <p className="mb-2 text-sm font-semibold text-danger">
                  Error Details (Development Only):
                </p>
                <pre className="overflow-auto text-xs text-danger-600">
                  {this.state.error.message}
                </pre>
              </div>
            )}
            <button
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={this.handleReset}
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
