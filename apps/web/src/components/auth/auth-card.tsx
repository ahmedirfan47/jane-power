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
    <div className="w-full max-w-sm border border-rule bg-surface p-8">
      <div className="mb-8">
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
          jane<span className="text-gold">·</span>power
        </span>
      </div>
      <h1 className="t-h1 mb-2 text-ink">{title}</h1>
      {subtitle && <p className="mb-8 text-[14px] leading-relaxed text-ink-3">{subtitle}</p>}
      {children}
      {footer && (
        <div className="mt-8 border-t border-rule pt-5 text-[13px] text-ink-3">{footer}</div>
      )}
    </div>
  );
}