"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = {};

export default function ResetPage() {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <AuthCard
      title="Reset password"
      subtitle="We'll email you a reset link."
      footer={
        <Link href="/login" className="text-gold hover:underline">
          Back to sign in
        </Link>
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
        {state.error && (
          <p className="mb-4 rounded-md border border-down/30 bg-down/10 px-3 py-2 text-xs text-down">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="mb-4 rounded-md border border-up/30 bg-up/10 px-3 py-2 text-xs text-up">
            {state.message}
          </p>
        )}
        <Button pending={pending}>Send reset link</Button>
      </form>
    </AuthCard>
  );
}