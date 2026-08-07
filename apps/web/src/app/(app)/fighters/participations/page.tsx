import Link from "next/link";
import { getOrganizerParticipations } from "@boutforge/api";
import {
  BOUT_METHOD_LABELS,
  fighterFullName,
  participationRecord,
} from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";

export default async function OrganizerParticipationsPage() {
  const { supabase, clubId, membership } = await getAppContext();
  if (!clubId) return <p>No club</p>;

  const groups = await getOrganizerParticipations(supabase, clubId);
  const organizerName = membership?.club?.name ?? "Your club";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/fighters" className="text-boxing text-sm hover:underline">
            ← Back to roster
          </Link>
          <h1 className="text-2xl font-bold text-navy mt-2">Fixture participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fighters who competed in fixtures organized by {organizerName}, grouped by
            their home club.
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <p className="text-gray-400 text-sm">
            No participation records yet. Results are logged here when you complete bouts
            in your fixtures.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.home_club_id} className="card p-0 overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-navy">{group.home_club_name}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {group.fighters.length} fighter{group.fighters.length === 1 ? "" : "s"}{" "}
                participated in your fixtures
              </p>
            </div>
            <div className="table-scroll">
            <table>
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Fighter
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Record at your fixtures
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Bouts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.fighters.map((summary) => (
                  <tr key={summary.fighter.id} className="hover:bg-gray-50 align-top">
                    <td className="px-6 py-4">
                      <Link
                        href={`/fighters/${summary.fighter.id}`}
                        className="font-medium text-sm text-boxing hover:underline"
                      >
                        {fighterFullName(summary.fighter)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="badge bg-blue-100 text-blue-800">
                        {summary.fighter.age_category?.name ?? "—"}
                      </span>{" "}
                      <span className="badge bg-gray-100 text-gray-700">
                        {summary.fighter.weight_class?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {participationRecord(summary)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <ul className="space-y-1">
                        {summary.participations.slice(0, 3).map((entry) => (
                          <li key={entry.id} className="text-xs text-gray-600">
                            <span
                              className={
                                entry.outcome === "win"
                                  ? "text-green-700"
                                  : entry.outcome === "loss"
                                    ? "text-red-700"
                                    : "text-gray-700"
                              }
                            >
                              {entry.outcome.toUpperCase()}
                            </span>
                            {entry.method ? ` · ${BOUT_METHOD_LABELS[entry.method]}` : ""}
                            {entry.bracket?.name ? ` · ${entry.bracket.name}` : ""}
                          </li>
                        ))}
                        {summary.participations.length > 3 && (
                          <li className="text-xs text-gray-400">
                            +{summary.participations.length - 3} more
                          </li>
                        )}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
