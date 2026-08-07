"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteBracket, getUserClubs, updateBracket } from "@boutforge/api";
import {
  bracketEditSchema,
  canDeleteBracket,
  canEditPairings,
  type Bracket,
} from "@boutforge/shared";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export function EditFixtureForm({ bracket }: { bracket: Bracket }) {
  const router = useRouter();
  const supabase = createClient();
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [form, setForm] = useState({
    name: bracket.name,
    status: bracket.status,
    venue: bracket.venue ?? "",
    scheduled_date: bracket.scheduled_date ?? "",
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

        const membership = clubs.find((entry) => entry.club_id === bracket.club_id);
        const role = membership?.role;
        setCanEdit(role ? canEditPairings(role) : false);
        setCanDelete(role ? canDeleteBracket(role) : false);
      } finally {
        if (active) end();
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase, bracket.club_id, end]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!canEdit) {
      setError("You do not have permission to edit this fixture.");
      return;
    }

    const parsed = bracketEditSchema.safeParse({
      ...form,
      venue: form.venue.trim() || null,
      scheduled_date: form.scheduled_date.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await updateBracket(supabase, bracket.id, parsed.data);
      router.push(`/fixtures/${bracket.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fixture");
      setLoading(false);
    }
  }

  return (
    <LoadingOverlay
      loading={isPending || loading}
      label={loading ? "Saving fixture…" : "Loading…"}
    >
      <div className="max-w-lg space-y-6">
        <div>
          <Link href={`/fixtures/${bracket.id}`} className="text-boxing text-sm hover:underline">
            ← Back to fixture
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-2">Edit Fixture</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Fixture name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
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
                  status: e.target.value as Bracket["status"],
                })
              }
              disabled={!canEdit}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Venue</label>
            <input
              className="input-field"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scheduled date</label>
            <input
              type="date"
              className="input-field"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !canEdit}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>

        {canDelete && (
          <div className="card border-red-100 space-y-3">
            <h2 className="font-semibold text-navy">Danger zone</h2>
            <p className="text-sm text-gray-500">
              Deleting this fixture removes all bouts and results in this bracket.
            </p>
            <DeleteEntityButton
              label="Delete fixture"
              confirmMessage={`Delete "${bracket.name}"? This cannot be undone.`}
              onDelete={() => deleteBracket(supabase, bracket.id)}
              redirectTo="/fixtures"
            />
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}
