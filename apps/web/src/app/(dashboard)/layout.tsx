import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh overflow-hidden">{children}</div>;
}