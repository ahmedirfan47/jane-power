"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[jane-power] component error:", error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-[11px] text-mute">
          {this.props.label ?? "This panel"} failed to load.
        </p>
        <button
          onClick={this.reset}
          className="rounded-md border border-hair px-2.5 py-1 text-[11px] text-mute transition-colors hover:text-ink"
        >
          Retry
        </button>
      </div>
    );
  }
}