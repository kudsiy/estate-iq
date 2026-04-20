import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#1a1d2e] border border-[#2a2d3e] rounded-[32px] p-12 shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground font-medium mb-10 leading-relaxed">
              We encountered an unexpected error. Please refresh the page to continue.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-accent hover:bg-accent/90 text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-accent/20 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
