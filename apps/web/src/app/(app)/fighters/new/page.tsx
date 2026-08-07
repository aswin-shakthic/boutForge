"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFighter, getUserClubs } from "@boutforge/api";
import { canManageFighters, fighterSchema } from "@boutforge/shared";
import type { ClubMember } from "@boutforge/shared";
import { ClubSelector } from "@/components/ClubSelector";
import Link from "next/link";

export default function NewFighterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "male" as "male" | "female",
    weight_kg: 0,
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const clubs = await getUserClubs(supabase, user.id);
      setMemberships(clubs);
      if (clubs.length > 0) {
        setSelectedClubId(clubs[0].club_id);
        setCanCreate(canManageFighters(clubs[0].role));
      }
    }
    load();
  }, [supabase]);

  function handleClubChange(clubId: string) {
    setSelectedClubId(clubId);
    const membership = memberships.find((entry) => entry.club_id === clubId);
    setCanCreate(membership ? canManageFighters(membership.role) : false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedClubId) {
      setError("Select a club first");
      return;
    }
    if (!canCreate) {
      setError("You do not have permission to add fighters for this club.");
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
      await createFighter(supabase, selectedClubId, parsed.data);
      router.push("/fighters");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fighter");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/fighters" className="text-boxing text-sm hover:underline">
          ← Back to fighters
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Add Fighter</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <ClubSelector
          memberships={memberships}
          selectedClubId={selectedClubId}
          onChange={handleClubChange}
          description="The fighter will be registered on this club's roster."
        />

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
              disabled={!canCreate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last name</label>
            <input
              className="input-field"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              disabled={!canCreate}
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
            disabled={!canCreate}
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
            disabled={!canCreate}
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
            onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) })}
            required
            disabled={!canCreate}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!canCreate}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || !canCreate}>
          {loading ? "Saving..." : "Add Fighter"}
        </button>
      </form>
    </div>
  );
}
