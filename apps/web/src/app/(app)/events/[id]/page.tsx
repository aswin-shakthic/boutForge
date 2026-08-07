import Link from "next/link";
import { getBracketsByEvent } from "@boutforge/api";
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

  const brackets = await getBracketsByEvent(supabase, id);

  return (
    <div className="space-y-6">
      <Link href="/events" className="text-boxing text-sm hover:underline">
        ← Back to events
      </Link>

      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy">{event.name}</h1>
            <p className="text-gray-500 mt-1">
              {event.date} · {event.venue ?? "TBD"} · {event.state_zone ?? ""}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-800">{event.status}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/fixtures/new?eventId=${event.id}`}
            className="btn-primary text-sm"
          >
            + Add brackets
          </Link>
          {event.status === "draft" && <PublishEventButton eventId={event.id} />}
        </div>

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

        <div className="mt-6">
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
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3 text-sm hover:border-boxing/30 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-navy">{bracket.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {bracket.age_category?.name ?? "Category"} ·{" "}
                      {bracket.weight_class?.gender ?? bracket.gender} ·{" "}
                      {bracket.weight_class?.name ?? "Weight class"}
                    </p>
                  </div>
                  <span className="badge bg-gray-100 text-gray-700">{bracket.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
