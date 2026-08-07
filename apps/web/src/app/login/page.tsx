"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { resolveAuthDestination } from "@boutforge/api";
import { loginSchema } from "@boutforge/shared";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";
import { LoadingOverlay } from "@/components/LoadingOverlay";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Email confirmation failed. Try signing in or sign up again.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!configured) return;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const destination = await resolveAuthDestination(supabase);

    setLoading(false);
    router.push(destination === "dashboard" ? "/dashboard" : "/onboarding");
    router.refresh();
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your club account">
      <LoadingOverlay loading={loading} label="Signing in…">
      <SupabaseConfigAlert />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!configured}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!configured}
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || !configured}
        >
          {loading ? "Signing in..." : "Log In"}
        </button>
        <div className="flex justify-between text-sm">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
          <AuthLink href="/signup">Sign up</AuthLink>
        </div>
      </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
