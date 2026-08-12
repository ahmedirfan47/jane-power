"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/lib/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start monitoring the markets."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction}>
        <TextField
          label="Display name"
          name="displayName"
          autoComplete="name"
          placeholder="Ahmed"
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          required
          minLength={6}
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
        <Button pending={pending}>Create account</Button>
      </form>
    </AuthCard>
  );
}