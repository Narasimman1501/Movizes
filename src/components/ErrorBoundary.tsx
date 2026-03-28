import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore ${parsed.operationType} error: ${parsed.error}`;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card max-w-md w-full p-8 rounded-xl shadow-2xl border border-white/5 flex flex-col items-center text-center gap-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-sm text-text-muted leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button 
              onClick={this.handleReset}
              className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-md font-bold text-sm flex items-center gap-2 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              RETRY
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
