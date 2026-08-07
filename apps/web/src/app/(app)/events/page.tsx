import { getEvents } from "@boutforge/api";
import { canDeleteEvent, canEditEvent, canManageEvents } from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { IconAction } from "@/components/ui/IconAction";

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
          <IconAction
            href="/events/new"
            label="Create event"
            icon="calendarPlus"
            variant="primary"
            mode="responsive"
            className="shrink-0"
          />
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
            const canDelete = canDeleteEvent(membership?.role, accessContext);

            return (
              <article key={event.id} className="card hover:border-boxing transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-navy">{event.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 break-words">
                      {event.date} · {event.venue ?? "TBD"}
                      {event.is_cross_club && " · Cross-club"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge bg-blue-100 text-blue-800 capitalize">
                      {event.status}
                    </span>
                    <IconAction
                      href={`/events/${event.id}`}
                      label="View event"
                      icon="eye"
                      variant="ghost"
                    />
                    {canEdit && (
                      <IconAction
                        href={`/events/${event.id}/edit`}
                        label="Edit event"
                        icon="pencil"
                        variant="ghost"
                      />
                    )}
                    {canDelete && (
                      <DeleteEventButton
                        eventId={event.id}
                        eventName={event.name}
                        compact
                      />
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
