"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserClubs, updateFighter } from "@boutforge/api";
import { canManageFighters, fighterSchema } from "@boutforge/shared";
import type { ClubMember, Fighter } from "@boutforge/shared";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";

export function EditFighterForm({ fighter }: { fighter: Fighter }) {
  const router = useRouter();
  const supabase = createClient();
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [form, setForm] = useState({
    first_name: fighter.first_name,
    last_name: fighter.last_name,
    dob: fighter.dob,
    gender: fighter.gender,
    weight_kg: fighter.weight_kg,
    notes: fighter.notes ?? "",
    affiliation_name: fighter.affiliation_name ?? "",
    status: fighter.status,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isPending, end } = usePendingLoads(1);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const clubs = await getUserClubs(supabase, user.id);
        if (!active) return;

        setMemberships(clubs);
        const membership = clubs.find((entry) => entry.club_id === fighter.club_id);
        setCanEdit(membership ? canManageFighters(membership.role) : false);
      } finally {
        if (active) end();
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase, fighter.club_id, end]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!canEdit) {
      setError("You do not have permission to edit this fighter.");
      return;
    }

    const parsed = fighterSchema.safeParse({
      ...form,
      weight_kg: Number(form.weight_kg),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await updateFighter(supabase, fighter.id, {
        ...parsed.data,
        affiliation_name: form.affiliation_name.trim() || null,
        status: form.status,
      });
      router.push(`/fighters/${fighter.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fighter");
      setLoading(false);
    }
  }

  return (
    <LoadingOverlay
      loading={isPending || loading}
      label={loading ? "Saving fighter…" : "Loading…"}
    >
      <div className="max-w-lg">
        <div className="mb-6">
          <Link
            href={`/fighters/${fighter.id}`}
            className="text-boxing text-sm hover:underline"
          >
            ← Back to fighter
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-2">Edit Fighter</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First name</label>
              <input
                className="input-field"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last name</label>
              <input
                className="input-field"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                disabled={!canEdit}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date of birth</label>
            <input
              type="date"
              className="input-field"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              className="input-field"
              value={form.gender}
              onChange={(e) =>
                setForm({ ...form, gender: e.target.value as "male" | "female" })
              }
              disabled={!canEdit}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              value={form.weight_kg || ""}
              onChange={(e) =>
                setForm({ ...form, weight_kg: parseFloat(e.target.value) })
              }
              required
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Affiliation (optional)</label>
            <input
              className="input-field"
              placeholder="Shown instead of home club when set"
              value={form.affiliation_name}
              onChange={(e) => setForm({ ...form, affiliation_name: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "active" | "inactive",
                })
              }
              disabled={!canEdit}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !canEdit}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </LoadingOverlay>
  );
}
