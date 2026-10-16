import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  // custom fallback; defaults to a small "something broke" panel
  fallback?: ReactNode;
  onError?: (error: unknown) => void;
  // clears the error when this changes (e.g. the route)
  resetKey?: unknown;
}

interface State {
  error: unknown;
  resetKey: unknown;
}

// One failing chunk or WebGL scene shouldn't blank the whole site.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.error == null) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-24 gap-4">
        <p className="font-mono text-xs tracking-widest text-[var(--text-tertiary)]">something broke</p>
        <button
          onClick={() => window.location.reload()}
          className="font-mono text-xs tracking-widest border border-[var(--border-primary)] rounded-full px-5 py-2.5 hover:border-[var(--text-primary)] transition-colors"
        >
          reload the page
        </button>
      </div>
    );
  }
}
