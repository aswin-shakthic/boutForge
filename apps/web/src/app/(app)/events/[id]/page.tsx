import Link from "next/link";
import { publishEvent } from "@boutforge/api";
import { getAppContext } from "@/lib/app-context";
import { PublishEventButton } from "./PublishEventButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAppContext();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_clubs(*, club:clubs(*))")
    .eq("id", id)
    .single();

  if (!event) return <p>Event not found</p>;

  return (
    <div className="space-y-6">
      <Link href="/events" className="text-boxing text-sm hover:underline">
        ← Back to events
      </Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">{event.name}</h1>
            <p className="text-gray-500 mt-1">
              {event.date} · {event.venue ?? "TBD"} · {event.state_zone ?? ""}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-800">{event.status}</span>
        </div>

        {event.status === "draft" && <PublishEventButton eventId={event.id} />}

        <div className="mt-6">
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
      </div>
    </div>
  );
}
