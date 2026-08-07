import Link from "next/link";
import { getFighters } from "@boutforge/api";
import {
  fighterFullName,
  fighterRecord,
  getAgeFromDob,
  getFighterClubDisplayName,
  canManageFighters,
} from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";

export default async function FightersPage() {
  const { supabase, clubIds, membership } = await getAppContext();
  if (clubIds.length === 0) return <p>No club</p>;

  const fighters = await getFighters(supabase, clubIds);
  const canEdit = membership ? canManageFighters(membership.role) : false;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Fighters</h1>
        <div className="page-actions">
          <Link href="/fighters/participations" className="btn-secondary text-sm">
            Participants
          </Link>
          <Link href="/import" className="btn-secondary text-sm">
            Import CSV
          </Link>
          <Link href="/fighters/new" className="btn-primary text-sm">
            + Add Fighter
          </Link>
        </div>
      </div>

      {fighters.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No fighters yet. Add your first fighter to get started.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {fighters.map((fighter) => (
              <article key={fighter.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-navy truncate">{fighterFullName(fighter)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {getAgeFromDob(fighter.dob)} yrs · {fighter.gender} · {fighter.weight_kg} kg
                    </p>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {getFighterClubDisplayName(fighter)}
                    </p>
                  </div>
                  <span className="font-mono text-sm shrink-0">{fighterRecord(fighter)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-blue-100 text-blue-800">
                    {fighter.age_category?.name ?? "—"}
                  </span>
                  <span className="badge bg-gray-100 text-gray-700">
                    {fighter.weight_class?.name ?? "—"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/fighters/${fighter.id}`}
                    className="btn-secondary flex-1 text-sm text-center"
                  >
                    View profile
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/fighters/${fighter.id}/edit`}
                      className="btn-secondary flex-1 text-sm text-center"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="card p-0 overflow-hidden hidden md:block">
            <div className="table-scroll">
              <table>
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Club
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Weight
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Record
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fighters.map((fighter) => (
                    <tr key={fighter.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <p className="font-medium text-sm">{fighterFullName(fighter)}</p>
                        <p className="text-xs text-gray-500">
                          {getAgeFromDob(fighter.dob)} yrs · {fighter.gender}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                        {getFighterClubDisplayName(fighter)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm">
                        <span className="badge bg-blue-100 text-blue-800">
                          {fighter.age_category?.name ?? "—"}
                        </span>{" "}
                        <span className="badge bg-gray-100 text-gray-700">
                          {fighter.weight_class?.name ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm">{fighter.weight_kg} kg</td>
                      <td className="px-4 lg:px-6 py-4 text-sm font-mono">
                        {fighterRecord(fighter)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/fighters/${fighter.id}`}
                            className="text-boxing text-sm hover:underline"
                          >
                            View
                          </Link>
                          {canEdit && (
                            <Link
                              href={`/fighters/${fighter.id}/edit`}
                              className="text-gray-600 text-sm hover:underline"
                            >
                              Edit
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
