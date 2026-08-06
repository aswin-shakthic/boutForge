"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createFighter } from "@boutforge/api";
import { fighterSchema } from "@boutforge/shared";
import Link from "next/link";

export default function NewFighterPage() {
  const router = useRouter();
  const supabase = createClient();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = fighterSchema.safeParse({
      ...form,
      weight_kg: Number(form.weight_kg),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const { data: membership } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) { setError("No club found"); setLoading(false); return; }

    try {
      await createFighter(supabase, membership.club_id, parsed.data);
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
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First name</label>
            <input className="input-field" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last name</label>
            <input className="input-field" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date of birth</label>
          <input type="date" className="input-field" value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select className="input-field" value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input type="number" step="0.1" className="input-field" value={form.weight_kg || ""}
            onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="input-field" rows={3} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Add Fighter"}
        </button>
      </form>
    </div>
  );
}
