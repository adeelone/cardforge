import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in dev; a static app has no server to report to.
    console.error('CardForge crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <div className="crash-card">
            <h1>Something went sideways</h1>
            <p>The editor hit an unexpected error. Your saved designs are safe in local storage.</p>
            <pre>{this.state.error.message}</pre>
            <div className="crash-actions">
              <button type="button" className="primary-button" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
                Reload CardForge
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
