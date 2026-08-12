import { APP_NAME } from "@jane-power/shared";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 shadow-2xl">
      <div className="mb-6 flex items-baseline gap-2.5">
        <span className="text-lg text-gold">◆</span>
        <span className="font-mono text-base font-bold tracking-[0.14em]">
          {APP_NAME.toUpperCase()}
        </span>
        <span className="font-mono text-[9px] tracking-[0.2em] text-muted">TERMINAL</span>
      </div>
      <h1 className="mb-1 text-lg font-semibold text-txt">{title}</h1>
      {subtitle && <p className="mb-6 text-sm text-muted">{subtitle}</p>}
      {children}
      {footer && (
        <div className="mt-6 border-t border-line-soft pt-4 text-center text-xs text-muted">
          {footer}
        </div>
      )}
    </div>
  );
}