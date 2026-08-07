"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageLoader } from "@/components/PageLoader";
import { usePendingLoads } from "@/hooks/usePendingLoads";

export default function ResetPasswordPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { isPending, end } = usePendingLoads(1);

  useEffect(() => {
    if (!configured) {
      end();
      return;
    }

    let active = true;
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && active) setReady(true);
    }).finally(() => {
      if (active) end();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured, end]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now sign in">
        <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg text-sm text-center">
          Password saved. Redirecting to login…
        </p>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout title="Reset password" subtitle="Verifying your reset link">
        <SupabaseConfigAlert />
        {isPending ? (
          <PageLoader label="Verifying reset link…" inline />
        ) : (
          <>
            <p className="text-gray-500 text-sm text-center">
              {configured
                ? "Open the reset link from your email to continue."
                : "Authentication is not configured on this deployment."}
            </p>
            <div className="text-center mt-4">
              <AuthLink href="/login">Back to login</AuthLink>
            </div>
          </>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter your new password below">
      <LoadingOverlay loading={loading} label="Updating password…">
      <SupabaseConfigAlert />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            type="password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
