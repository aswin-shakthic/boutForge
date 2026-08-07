"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createInvite, getProfile, updateProfile } from "@boutforge/api";
import { inviteSchema } from "@boutforge/shared";
import { signupInviteUrl } from "@/lib/app-url";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";

export default function SettingsPage() {
  const supabase = createClient();
  const [role, setRole] = useState<"coach" | "viewer" | "club_admin">("coach");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { isPending, end } = usePendingLoads(1);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }: { data: { user: User | null } }) => {
        if (!user || !active) return;
        setEmail(user.email ?? "");

        const profile = await getProfile(supabase, user.id);
        if (profile && active) setFullName(profile.full_name);

        const { data } = await supabase
          .from("club_members")
          .select("club_id")
          .eq("user_id", user.id)
          .single();
        if (data && active) setClubId(data.club_id);
      })
      .finally(() => {
        if (active) end();
      });

    return () => {
      active = false;
    };
  }, [supabase, end]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);

    if (!fullName.trim()) {
      setProfileError("Name is required");
      return;
    }

    setProfileLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      await updateProfile(supabase, user.id, { full_name: fullName.trim() });

      if (newPassword.trim().length >= 6) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });
        if (pwError) throw pwError;
        setNewPassword("");
      } else if (newPassword.trim().length > 0) {
        throw new Error("Password must be at least 6 characters");
      }

      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleCreateInvite() {
    if (!clubId) return;
    setError("");
    const parsed = inviteSchema.safeParse({ role });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const invite = await createInvite(supabase, clubId, role);
      setInviteLink(signupInviteUrl(invite.token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    }
    setLoading(false);
  }

  return (
    <LoadingOverlay
      loading={isPending || loading || profileLoading}
      label={
        profileLoading ? "Saving profile…" : loading ? "Generating invite…" : "Loading settings…"
      }
    >
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>

      <form onSubmit={handleSaveProfile} className="card space-y-4">
        <h2 className="font-semibold text-navy">Your profile</h2>

        {profileError && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {profileError}
          </div>
        )}
        {profileSaved && (
          <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">
            Profile updated.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="input-field bg-gray-50" value={email} disabled readOnly />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input
            type="password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={profileLoading}>
          {profileLoading ? "Saving..." : "Save profile"}
        </button>
      </form>

      <div className="card space-y-4">
        <h2 className="font-semibold text-navy">Invite Team Members</h2>
        <p className="text-sm text-gray-500">
          Generate an invite link for coaches or viewers to join your club.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            className="input-field"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "coach" | "viewer" | "club_admin")
            }
          >
            <option value="coach">Coach</option>
            <option value="viewer">Viewer</option>
            <option value="club_admin">Club Admin</option>
          </select>
        </div>

        <button
          onClick={handleCreateInvite}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Invite Link"}
        </button>

        {inviteLink && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Invite link (valid 7 days):</p>
            <code className="text-sm break-all">{inviteLink}</code>
          </div>
        )}
      </div>
    </div>
    </LoadingOverlay>
  );
}
