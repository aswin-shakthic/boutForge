"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deleteEvent, getAllClubs, updateEvent } from "@boutforge/api";
import {
  canDeleteEvent,
  canEditEvent,
  eventSchema,
  type Club,
  type Event,
  type UserRole,
} from "@boutforge/shared";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export function EditEventForm({
  event,
  userRole,
  userId,
  userClubId,
  isPlatformAdmin,
}: {
  event: Event & { event_clubs?: Array<{ club_id: string; club?: { name: string } }> };
  userRole: UserRole | null;
  userId: string;
  userClubId: string | null;
  isPlatformAdmin: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(
    new Set((event.event_clubs ?? []).map((entry) => entry.club_id))
  );
  const [form, setForm] = useState({
    name: event.name,
    date: event.date,
    venue: event.venue ?? "",
    state_zone: event.state_zone ?? "",
    is_cross_club: event.is_cross_club,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { isPending, end } = usePendingLoads(1);

  const accessContext = {
    isPlatformAdmin,
    userId,
    organizerUserId: event.organizer_user_id,
    organizerClubId: event.organizer_club_id,
    userClubId,
  };
  const canEdit = canEditEvent(userRole, accessContext);
  const canDelete = canDeleteEvent(userRole, accessContext);

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

    if (!canEdit) {
      setError("You do not have permission to edit this event.");
      return;
    }

    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await updateEvent(supabase, event.id, parsed.data, Array.from(selectedClubs));
      router.push(`/events/${event.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
      setLoading(false);
    }
  }

  return (
    <LoadingOverlay
      loading={isPending || loading}
      label={loading ? "Saving event…" : "Loading…"}
    >
      <div className="max-w-lg space-y-6">
        <div>
          <Link href={`/events/${event.id}`} className="text-boxing text-sm hover:underline">
            ← Back to event
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-2">Edit Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Event name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={!canEdit}
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
              disabled={!canEdit}
            />
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
            <label className="block text-sm font-medium mb-1">State / Zone</label>
            <input
              className="input-field"
              value={form.state_zone}
              onChange={(e) => setForm({ ...form, state_zone: e.target.value })}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Participating clubs</label>
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
                    disabled={!canEdit}
                  />
                  {club.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !canEdit}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>

        {canDelete && (
          <div className="card border-red-100 space-y-3">
            <h2 className="font-semibold text-navy">Danger zone</h2>
            <p className="text-sm text-gray-500">
              Deleting this event removes all brackets and fixtures linked to it.
            </p>
            <DeleteEntityButton
              label="Delete event"
              confirmMessage={`Delete "${event.name}" and all its brackets? This cannot be undone.`}
              onDelete={() => deleteEvent(supabase, event.id)}
              redirectTo="/events"
            />
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}
