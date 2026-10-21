import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusLoop Caught Error via ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-[var(--bg-page)] text-[var(--text-primary)]">
          <div className="max-w-md w-full bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-6 sm:p-8 shadow-card text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">
              Something went unexpected
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              We encountered a minor interface problem loading this screen. Your data in the database is safe.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return to Campus Home
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="text-left bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-color)] text-[11px] font-mono text-red-400 overflow-x-auto">
                <summary className="cursor-pointer font-bold text-[var(--text-muted)] mb-1">
                  Debug Details
                </summary>
                <p>{this.state.error.toString()}</p>
                <pre className="mt-2 text-[10px] text-[var(--text-muted)]">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
