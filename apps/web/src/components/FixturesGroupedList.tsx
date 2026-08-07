import Link from "next/link";
import { groupBracketsByEvent, type BracketListItem } from "@boutforge/shared";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function FixturesGroupedList({ brackets }: { brackets: BracketListItem[] }) {
  const eventGroups = groupBracketsByEvent(brackets);

  if (eventGroups.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        No fixtures yet. Create your first knockout bracket from an event.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {eventGroups.map((eventGroup) => (
        <section key={eventGroup.key} className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-navy">{eventGroup.title}</h2>
              {eventGroup.subtitle && (
                <p className="text-sm text-gray-500 mt-1 capitalize">{eventGroup.subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-800 capitalize">
                {formatLabel(eventGroup.eventStatus)}
              </span>
              {eventGroup.eventId !== "unknown" && (
                <Link href={`/events/${eventGroup.eventId}`} className="btn-secondary text-sm">
                  View event
                </Link>
              )}
            </div>
          </div>

          <div className="space-y-8 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-gray-100">
            {eventGroup.sections.map((section) => (
              <div key={section.key} className="space-y-4">
                <div>
                  <h3 className="font-semibold text-navy">{section.title}</h3>
                  {section.subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5 capitalize">{section.subtitle}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {section.brackets.map((bracket) => (
                    <article
                      key={bracket.id}
                      className="card hover:border-boxing transition-colors flex flex-col gap-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-navy">{bracket.name}</h4>
                          <p className="text-sm text-gray-500 mt-1 capitalize">
                            {formatLabel(bracket.format)} · {formatLabel(bracket.status)}
                            {bracket.scheduled_date ? ` · ${bracket.scheduled_date}` : ""}
                          </p>
                        </div>
                        <span className="badge bg-gray-100 text-gray-700 shrink-0 capitalize">
                          {formatLabel(bracket.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/fixtures/${bracket.id}`} className="btn-primary text-sm">
                          View bracket
                        </Link>
                        <Link
                          href={`/fixtures/${bracket.id}?print=1`}
                          className="btn-secondary text-sm"
                        >
                          Print
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
