import Link from "next/link";
import { getEvents } from "@boutforge/api";
import { canManageEvents } from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";

export default async function EventsPage() {
  const { supabase, membership, isPlatformAdmin } = await getAppContext();
  const events = await getEvents(supabase);
  const canCreate = membership
    ? canManageEvents(membership.role, isPlatformAdmin)
    : false;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Events</h1>
        {canCreate && (
          <Link href="/events/new" className="btn-primary shrink-0 text-sm sm:text-base">
            + Create Event
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No events yet.
          </div>
        ) : (
          events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="card hover:border-boxing transition-colors"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-navy">{event.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 break-words">
                    {event.date} · {event.venue ?? "TBD"}
                    {event.is_cross_club && " · Cross-club"}
                  </p>
                </div>
                <span className="badge bg-blue-100 text-blue-800">
                  {event.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
