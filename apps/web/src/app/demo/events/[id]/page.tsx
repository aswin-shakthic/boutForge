import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_EVENTS, MOCK_EVENT_CLUBS } from "@/lib/mock-data";

export default async function DemoEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) notFound();

  const clubs = MOCK_EVENT_CLUBS.filter((ec) => ec.event_id === id);

  return (
    <div className="space-y-6">
      <Link href="/demo/events" className="text-boxing text-sm hover:underline">
        ← Back to events
      </Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy">{event.name}</h1>
            <p className="text-gray-500 mt-1">
              {event.date} · {event.venue} · {event.state_zone}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-800">{event.status}</span>
        </div>

        {event.status === "draft" && (
          <button className="btn-primary mt-4">Publish Event</button>
        )}

        <div className="mt-6">
          <h2 className="font-semibold text-navy mb-3">Participating Clubs</h2>
          <div className="space-y-2">
            {clubs.map((ec) => (
              <div key={ec.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                {ec.club.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
