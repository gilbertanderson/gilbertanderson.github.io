import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render/runtime errors in the React tree so a single broken screen
// shows a recoverable fallback instead of unmounting the whole app to a blank
// page.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    // Full reload is the safest recovery: it re-runs auth bootstrap and clears
    // any corrupt in-memory state.
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="app">
          <div className="center-fill" style={{ flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
            <p style={{ color: 'var(--muted-foreground)', margin: 0, maxWidth: 320 }}>
              The app hit an unexpected error. Reloading usually fixes it.
            </p>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
