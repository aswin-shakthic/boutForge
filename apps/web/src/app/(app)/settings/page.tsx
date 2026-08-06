"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { createInvite } from "@boutforge/api";
import { inviteSchema } from "@boutforge/shared";

export default function SettingsPage() {
  const supabase = createClient();
  const [role, setRole] = useState<"coach" | "viewer" | "club_admin">("coach");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }: { data: { user: User | null } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id)
        .single();
      if (data) setClubId(data.club_id);
    });
  }, [supabase]);

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
      setInviteLink(`${window.location.origin}/signup?invite=${invite.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Settings</h1>

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
  );
}
