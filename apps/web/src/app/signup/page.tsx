"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createClub, joinClubWithInvite, resolveAuthDestination } from "@boutforge/api";
import { signupSchema } from "@boutforge/shared";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";
import { LoadingOverlay } from "@/components/LoadingOverlay";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    club_name: "",
    invite_token: "",
  });
  const [useInvite, setUseInvite] = useState(false);
  const [error, setError] = useState("");
  const [confirmEmail, setConfirmEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const invite = searchParams.get("invite");
    if (invite) {
      setForm((f) => ({ ...f, invite_token: invite }));
      setUseInvite(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!configured) return;

    const payload = useInvite
      ? { ...form, club_name: undefined }
      : { ...form, invite_token: undefined };

    const parsed = signupSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          pending_club_name: useInvite ? null : form.club_name,
          pending_invite_token: useInvite ? form.invite_token : null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (data.user && !data.session) {
      setLoading(false);
      setConfirmEmail(true);
      return;
    }

    if (data.session) {
      try {
        if (useInvite && form.invite_token) {
          await joinClubWithInvite(supabase, form.invite_token);
        } else if (form.club_name) {
          await createClub(supabase, form.club_name);
        }
        await supabase.auth.updateUser({
          data: { pending_club_name: null, pending_invite_token: null },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set up club");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    const destination = await resolveAuthDestination(supabase);
    router.push(destination === "dashboard" ? "/dashboard" : "/onboarding");
    router.refresh();
  }

  if (confirmEmail) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step to activate your account">
        <div className="text-center space-y-4">
          <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg text-sm">
            We sent a confirmation link to <strong>{form.email}</strong>. After
            confirming, you&apos;ll be guided to finish club setup automatically.
          </p>
          <AuthLink href="/login">Go to login</AuthLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Set up your boxing club">
      <LoadingOverlay loading={loading} label="Creating account…">
      <SupabaseConfigAlert />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            className="input-field"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            disabled={!configured}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={!configured}
          />
        </div>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={!useInvite}
              onChange={() => setUseInvite(false)}
              disabled={!configured}
            />
            Create new club
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={useInvite}
              onChange={() => setUseInvite(true)}
              disabled={!configured}
            />
            Join with invite
          </label>
        </div>

        {useInvite ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite code
            </label>
            <input
              className="input-field"
              value={form.invite_token}
              onChange={(e) => setForm({ ...form, invite_token: e.target.value })}
              required
              disabled={!configured}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Club name
            </label>
            <input
              className="input-field"
              value={form.club_name}
              onChange={(e) => setForm({ ...form, club_name: e.target.value })}
              required
              disabled={!configured}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading || !configured}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <div className="text-center text-sm">
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </div>
      </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
