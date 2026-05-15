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
        <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-red-500/20 bg-red-500/5 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">System Interruption</h1>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                A critical interface error occurred. Our engineers have been notified.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-obsidian rounded-xl text-left border border-white/5 overflow-hidden">
                <p className="text-[10px] font-black text-red-400 uppercase mb-2">Stack Trace</p>
                <code className="text-[10px] text-slate-500 break-all">{this.state.error?.toString()}</code>
              </div>
            )}

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
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
