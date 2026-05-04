import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const errorMsg = this.state.error?.message;
        if (errorMsg && errorMsg.startsWith('{')) {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error) errorMessage = parsed.error;
        } else {
          errorMessage = errorMsg || errorMessage;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-8 text-center">
          <div className="p-8 bg-white border-8 border-black shadow-[24px_24px_0px_0px_rgba(239,68,68,1)] max-w-2xl">
            <AlertTriangle size={80} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-5xl font-black uppercase italic mb-4">Neural Breach Detected</h1>
            <p className="text-xl font-bold mb-8 opacity-60 text-wrap break-words">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-5 bg-black text-white font-black uppercase italic hover:bg-orange-500 transition-all border-4 border-black"
            >
              Re-Initialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
