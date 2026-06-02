import { Component } from 'react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error('UI error:', error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-navy px-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-light p-8 text-center shadow-sm">
            <h1 className="text-lg font-bold text-navy dark:text-white">Something went wrong</h1>
            <p className="text-sm text-muted mt-2">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" onClick={() => window.location.reload()}>
                Reload page
              </Button>
              <Button variant="outline" onClick={() => window.location.assign('/')}>
                Go home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
