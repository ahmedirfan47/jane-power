import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/terminal/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}