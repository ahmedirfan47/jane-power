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
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-[13px] text-ink-3">
          {this.props.label ?? "This panel"} couldn&apos;t load.
        </p>
        <button
          onClick={this.reset}
          className="border border-rule px-3 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          Try again
        </button>
      </div>
    );
  }
}