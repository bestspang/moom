import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MemberHeaderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MemberHeaderErrorBoundary] Header crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background shadow-sm px-4">
          <span className="text-lg font-bold tracking-tight text-primary">MOOM</span>
          <span className="text-xs text-destructive">Header error</span>
        </header>
      );
    }
    return this.props.children;
  }
}
