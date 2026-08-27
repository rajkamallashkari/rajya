import { Component, type ReactNode } from "react";
import { i18n } from "@/shared/lib/i18n";
import { Button } from "@/shared/ui/button";

export type ErrorBoundaryLevel = "app" | "route" | "list";

interface ErrorBoundaryProps {
  children: ReactNode;
  level: ErrorBoundaryLevel;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(): void {
    this.setState({ hasError: true });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const titleKey = `errors.${this.props.level}.title`;
    const retryKey = `errors.${this.props.level}.retry`;

    return (
      <div
        role="alert"
        className="flex min-h-[var(--touch-target-min)] flex-col items-center justify-center gap-[var(--space-4)] bg-[var(--surface-app)] p-[var(--space-6)] text-[var(--text-primary)]"
      >
        <p>{i18n.t(titleKey)}</p>
        <Button type="button" onClick={this.handleRetry}>
          {i18n.t(retryKey)}
        </Button>
      </div>
    );
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="app">{children}</ErrorBoundary>;
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="route">{children}</ErrorBoundary>;
}

export function ListErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="list">{children}</ErrorBoundary>;
}
