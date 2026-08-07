"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";
import { createClient } from "@/lib/supabase/client";
import { createEvent, getAllClubs } from "@boutforge/api";
import { eventSchema } from "@boutforge/shared";
import type { Club } from "@boutforge/shared";

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: "",
    date: "",
    venue: "",
    state_zone: "",
    is_cross_club: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isPending, end } = usePendingLoads(1);

  useEffect(() => {
    let active = true;

    getAllClubs(supabase)
      .then((data) => {
        if (active) setClubs(data);
      })
      .finally(() => {
        if (active) end();
      });

    return () => {
      active = false;
    };
  }, [supabase, end]);

  function toggleClub(id: string) {
    const next = new Set(selectedClubs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClubs(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const event = await createEvent(
        supabase,
        parsed.data,
        Array.from(selectedClubs)
      );
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
      setLoading(false);
    }
  }

  return (
    <LoadingOverlay
      loading={isPending || loading}
      label={loading ? "Creating event…" : "Loading clubs…"}
    >
    <div className="max-w-lg space-y-6">
      <div>
        <Link href="/events" className="text-boxing text-sm hover:underline">
          ← Back to events
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Create Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Event name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="input-field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Venue</label>
          <input
            className="input-field"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State / Zone</label>
          <input
            className="input-field"
            value={form.state_zone}
            onChange={(e) => setForm({ ...form, state_zone: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Participating clubs
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clubs.map((club) => (
              <label
                key={club.id}
                className="flex items-center gap-2 text-sm p-2 border border-gray-100 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedClubs.has(club.id)}
                  onChange={() => toggleClub(club.id)}
                />
                {club.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
    </LoadingOverlay>
  );
}
