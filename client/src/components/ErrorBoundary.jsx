import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button, Card } from './ui';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Critical Error]', error, errorInfo);
    // You could send to Sentry here as well
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-obsidian flex items-center justify-center p-6">
          <div className="w-full min-w-[320px] max-w-2xl border border-red-500/20 bg-red-500/5 rounded-2xl p-8 text-center space-y-6 shadow-2xl mx-auto">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">System Interruption</h1>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                A critical interface error occurred. Our engineers have been notified.
              </p>
            </div>

            <div className="p-4 bg-[#0a0a0a] rounded-xl text-left border border-white/5 overflow-x-auto w-full">
              <p className="text-[10px] font-black text-red-400 uppercase mb-2">Stack Trace</p>
              <code className="text-xs text-red-300 font-mono whitespace-pre-wrap break-words block w-full max-h-64 overflow-y-auto premium-scrollbar">
                {typeof this.state.error === 'string' ? this.state.error : this.state.error?.message || this.state.error?.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </code>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1" 
                icon={RotateCcw}
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
              <Button 
                variant="primary" 
                className="flex-1" 
                icon={Home}
                onClick={() => window.location.href = '/'}
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

export default GlobalErrorBoundary;
