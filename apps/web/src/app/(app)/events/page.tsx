import Link from "next/link";
import { getEvents } from "@boutforge/api";
import { canEditEvent, canManageEvents } from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";

export default async function EventsPage() {
  const { supabase, membership, isPlatformAdmin, profile, user, clubId } =
    await getAppContext();
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
          events.map((event) => {
            const accessContext = {
              isPlatformAdmin: profile?.is_platform_admin,
              userId: user.id,
              organizerUserId: event.organizer_user_id,
              organizerClubId: event.organizer_club_id,
              userClubId: clubId,
            };
            const canEdit = canEditEvent(membership?.role, accessContext);

            return (
              <article key={event.id} className="card hover:border-boxing transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/events/${event.id}`}>
                      <h3 className="font-semibold text-navy hover:text-boxing">{event.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 break-words">
                      {event.date} · {event.venue ?? "TBD"}
                      {event.is_cross_club && " · Cross-club"}
                    </p>
                  </div>
                  <span className="badge bg-blue-100 text-blue-800 self-start capitalize">
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/events/${event.id}`} className="btn-secondary text-sm">
                    View
                  </Link>
                  {canEdit && (
                    <Link href={`/events/${event.id}/edit`} className="btn-secondary text-sm">
                      Edit
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
