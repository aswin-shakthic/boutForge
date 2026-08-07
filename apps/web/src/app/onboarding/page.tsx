"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  completePendingSignup,
  createClub,
  getUserClubs,
  joinClubWithInvite,
} from "@boutforge/api";
import { AuthLayout } from "@/components/AuthLayout";
import { SupabaseConfigAlert } from "@/components/SupabaseConfigAlert";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PageLoader } from "@/components/PageLoader";

export default function OnboardingPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [useInvite, setUseInvite] = useState(false);
  const [clubName, setClubName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      await completePendingSignup(supabase);
      const clubs = await getUserClubs(supabase, user.id);
      if (clubs.length > 0) {
        router.replace("/dashboard");
        return;
      }

      const meta = user.user_metadata as {
        pending_club_name?: string;
        pending_invite_token?: string;
      };
      if (meta.pending_invite_token) {
        setInviteToken(meta.pending_invite_token);
        setUseInvite(true);
      } else if (meta.pending_club_name) {
        setClubName(meta.pending_club_name);
      }

      setLoading(false);
    }

    init();
  }, [configured, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!configured) return;

    if (useInvite && !inviteToken.trim()) {
      setError("Invite code is required");
      return;
    }
    if (!useInvite && !clubName.trim()) {
      setError("Club name is required");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      if (useInvite) {
        await joinClubWithInvite(supabase, inviteToken.trim());
      } else {
        await createClub(supabase, clubName.trim());
      }
      await supabase.auth.updateUser({
        data: { pending_club_name: null, pending_invite_token: null },
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up club");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthLayout title="Setting up" subtitle="Preparing your account">
        <PageLoader label="Preparing your account…" inline />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Finish setup" subtitle="Create or join a club to continue">
      <LoadingOverlay loading={submitting} label="Setting up your club…">
      <SupabaseConfigAlert />
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

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
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
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
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              disabled={!configured}
            />
          </div>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !configured}
        >
          {submitting ? "Saving…" : "Continue to dashboard"}
        </button>
      </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
