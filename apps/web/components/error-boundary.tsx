"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "~/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8">
          {/* Background glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-md space-y-6">
            <div className="flex justify-center">
              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                <AlertTriangle className="h-12 w-12" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Something went wrong
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                An unexpected error occurred. Our team has been notified.
              </p>
              {this.state.error && (
                <pre className="mt-3 text-left text-xs font-mono bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-rose-400 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                onClick={this.handleReset}
                className="bg-neutral-800 hover:bg-neutral-700 text-white flex items-center gap-2 cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
