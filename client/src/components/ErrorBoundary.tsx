import { cn } from "@/lib/utils";
import { AlertCircle, RotateCcw, Building2 } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050505] text-white font-sans text-center">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
          </div>

          <div className="relative z-10 max-w-sm w-full space-y-8">
            <div className="w-20 h-20 rounded-[2rem] bg-accent/20 border border-accent/20 flex items-center justify-center mx-auto shadow-2xl shadow-accent/20">
               <Building2 className="w-10 h-10 text-accent" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter italic">Connection Interrupted</h2>
              <div className="space-y-1">
                 <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                   The system encountered a protocol error. 
                 </p>
                 <p className="text-xs text-white/20 font-black uppercase tracking-widest leading-relaxed font-ethiopic">
                   ስርዓቱ አንዳንድ ችግሮች አጋጥመውታል። እባክዎ ገጹን እንደገና ይጫኑት።
                 </p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 h-16 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-accent/20 active:scale-[0.98] transition-all"
            >
              <RotateCcw size={16} />
              Reload Protocol
            </button>

            {process.env.NODE_ENV === "development" && (
              <div className="p-4 w-full rounded-2xl bg-white/5 border border-white/5 overflow-auto mt-10 text-left">
                <pre className="text-[10px] text-white/30 whitespace-break-spaces font-mono">
                  {this.state.error?.message}\n
                  {this.state.error?.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
