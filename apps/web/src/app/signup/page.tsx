"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createClub, joinClubWithInvite } from "@boutforge/api";
import { signupSchema } from "@boutforge/shared";
import { AuthLayout, AuthLink } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";

export default function SignupPage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);

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
      options: { data: { full_name: form.full_name } },
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    if (data.user) {
      try {
        if (useInvite && form.invite_token) {
          await joinClubWithInvite(supabase, form.invite_token);
        } else if (form.club_name) {
          await createClub(supabase, form.club_name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to set up club");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout title="Create account" subtitle="Set up your boxing club">
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
    </AuthLayout>
  );
}
