import Link from "next/link";
import { getBracketsByEvent } from "@boutforge/api";
import { getAppContext } from "@/lib/app-context";
import { EventCategoriesEditor } from "@/components/EventCategoriesEditor";
import { PublishEventButton } from "./PublishEventButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, membership, profile } = await getAppContext();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_clubs(*, club:clubs(*))")
    .eq("id", id)
    .single();

  if (!event) return <p>Event not found</p>;

  const brackets = await getBracketsByEvent(supabase, id);
  const canEditEvent =
    profile?.is_platform_admin ||
    event.organizer_user_id === profile?.id ||
    (membership?.club_id === event.organizer_club_id &&
      (membership.role === "club_admin" || membership.role === "coach"));

  return (
    <div className="space-y-6">
      <Link href="/events" className="text-boxing text-sm hover:underline">
        ← Back to events
      </Link>

      <div className="card space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title">{event.name}</h1>
            <p className="page-subtitle break-words">
              {event.date} · {event.venue ?? "TBD"} · {event.state_zone ?? ""}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-800 self-start capitalize">
            {event.status}
          </span>
        </div>

        <div className="page-actions">
          <Link
            href={`/fixtures/new?eventId=${event.id}`}
            className="btn-primary text-sm flex-1 sm:flex-none text-center"
          >
            + Add brackets
          </Link>
          {event.status === "draft" && <PublishEventButton eventId={event.id} />}
        </div>

        {canEditEvent && (
          <div className="border-t border-gray-100 pt-6">
            <EventCategoriesEditor eventId={event.id} />
          </div>
        )}

        <div>
          <h2 className="font-semibold text-navy mb-3">Participating Clubs</h2>
          <div className="space-y-2">
            {(event.event_clubs ?? []).map(
              (ec: { id: string; club: { name: string } }) => (
                <div
                  key={ec.id}
                  className="border border-gray-100 rounded-lg p-3 text-sm"
                >
                  {ec.club?.name}
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-navy mb-3">
            Brackets ({brackets.length})
          </h2>
          {brackets.length === 0 ? (
            <p className="text-sm text-gray-500">
              No brackets yet. Use &quot;Add brackets&quot; to create fixtures for this event.
            </p>
          ) : (
            <div className="space-y-2">
              {brackets.map((bracket) => (
                <Link
                  key={bracket.id}
                  href={`/fixtures/${bracket.id}`}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-lg p-3 text-sm hover:border-boxing/30 hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-navy">{bracket.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 capitalize">
                      {bracket.age_category?.name ?? "Category"} ·{" "}
                      {bracket.weight_class?.gender ?? bracket.gender} ·{" "}
                      {bracket.weight_class?.name ?? "Weight class"}
                    </p>
                  </div>
                  <span className="badge bg-gray-100 text-gray-700 self-start capitalize">
                    {bracket.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
