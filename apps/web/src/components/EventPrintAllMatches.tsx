"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";
import type { EventPrintSection } from "@boutforge/shared";

export function EventPrintAllMatches({
  eventName,
  eventDate,
  venue,
  sections,
  autoPrint = false,
}: {
  eventName: string;
  eventDate: string;
  venue: string | null;
  sections: EventPrintSection[];
  autoPrint?: boolean;
}) {
  useEffect(() => {
    if (!autoPrint) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint]);

  return (
    <div>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="text-boxing text-sm hover:underline text-left"
        >
          Back
        </button>
        <button type="button" onClick={() => window.print()} className="btn-secondary gap-2">
          <Printer className="h-4 w-4 shrink-0" aria-hidden />
          Print all matches
        </button>
      </div>

      <div id="event-print-area" className="bracket-print-sheet p-4 sm:p-6 md:p-10">
        <div className="text-center mb-10">
          <h1 className="bracket-print-title">{eventName}</h1>
          <p className="bracket-print-meta">
            {eventDate}
            {venue ? ` · ${venue}` : ""}
          </p>
          <p className="bracket-print-meta mt-1">All category matches</p>
        </div>

        {sections.length === 0 ? (
          <p className="text-center text-gray-500">No fixtures to print yet.</p>
        ) : (
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.bracketId} className="event-print-section">
                <h2 className="event-print-section-title">{section.title}</h2>
                {section.rounds.map((round) => (
                  <div key={`${section.bracketId}-${round.roundLabel}`} className="event-print-round">
                    <h3 className="event-print-round-title">{round.roundLabel}</h3>
                    <div className="event-print-table-wrap overflow-x-auto">
                      <table className="event-print-table">
                        <thead>
                          <tr>
                            <th>Match</th>
                            <th>Fighter A</th>
                            <th>Club</th>
                            <th>Fighter B</th>
                            <th>Club</th>
                          </tr>
                        </thead>
                        <tbody>
                          {round.matches.map((match) => (
                            <tr key={match.gameLabel}>
                              <td>{match.gameLabel}</td>
                              <td>{match.fighterA}</td>
                              <td>{match.fighterAClub ?? "—"}</td>
                              <td>{match.fighterB}</td>
                              <td>{match.fighterBClub ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
