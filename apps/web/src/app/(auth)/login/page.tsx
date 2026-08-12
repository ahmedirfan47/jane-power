"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your market terminal."
      footer={
        <>
          No account?{" "}
          <Link href="/register" className="text-gold hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form action={formAction}>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        {state.error && (
          <p className="mb-4 rounded-md border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">
            {state.error}
          </p>
        )}
        <Button pending={pending}>Sign in</Button>
      </form>
      <div className="mt-3 text-center">
        <Link href="/reset" className="text-xs text-muted hover:text-txt">
          Forgot password?
        </Link>
      </div>
    </AuthCard>
  );
}