"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@boutforge/shared";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!configured) return;

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a reset link">
      <SupabaseConfigAlert />
      {success ? (
        <div className="text-center space-y-4">
          <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg text-sm">
            Check your email for a password reset link.
          </p>
          <AuthLink href="/login">Back to login</AuthLink>
        </div>
      ) : (
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
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !configured}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
          <div className="text-center text-sm">
            <AuthLink href="/login">Back to login</AuthLink>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
