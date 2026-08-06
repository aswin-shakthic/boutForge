import Link from "next/link";
import { MOCK_EVENTS } from "@/lib/mock-data";

export default function DemoEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Events</h1>
        <span className="btn-primary opacity-50 cursor-not-allowed">+ Create Event</span>
      </div>

      <div className="grid gap-4">
        {MOCK_EVENTS.map((event) => (
          <Link
            key={event.id}
            href={`/demo/events/${event.id}`}
            className="card hover:border-boxing transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-navy">{event.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {event.date} · {event.venue} · Cross-club
                </p>
              </div>
              <span className="badge bg-blue-100 text-blue-800">{event.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
