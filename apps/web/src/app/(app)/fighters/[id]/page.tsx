import Link from "next/link";
import { getFighterHistory, getFighterOrganizerParticipations } from "@boutforge/api";
import {
  fighterFullName,
  fighterRecord,
  getAgeFromDob,
  BOUT_METHOD_LABELS,
  participationRecord,
} from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";

export default async function FighterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAppContext();

  const { data: fighter } = await supabase
    .from("fighters")
    .select("*, age_category:age_categories(*), weight_class:weight_classes(*), club:clubs(id, name)")
    .eq("id", id)
    .single();

  if (!fighter) {
    return <p>Fighter not found</p>;
  }

  const [history, organizerRecords] = await Promise.all([
    getFighterHistory(supabase, id),
    getFighterOrganizerParticipations(supabase, id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/fighters" className="text-boxing text-sm hover:underline">
          ← Back to fighters
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">
          {fighterFullName(fighter)}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Record</p>
          <p className="text-2xl font-bold text-navy font-mono mt-1">
            {fighterRecord(fighter)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Category</p>
          <p className="text-lg font-semibold text-navy mt-1">
            {fighter.age_category?.name} · {fighter.gender} · {fighter.weight_class?.name}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Home club</p>
          <p className="text-lg font-semibold text-navy mt-1">
            {fighter.club?.name ?? "—"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Details</p>
          <p className="text-sm mt-1">
            {getAgeFromDob(fighter.dob)} yrs · {fighter.weight_kg} kg
          </p>
        </div>
      </div>

      {organizerRecords.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-navy mb-4">
            Records by organizing club
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Separate win/loss totals for each club&apos;s fixtures this fighter joined.
          </p>
          <div className="space-y-4">
            {organizerRecords.map((record) => (
              <div
                key={record.organizer_club_id}
                className="border border-gray-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-navy">{record.organizer_club_name}</p>
                    <p className="text-xs text-gray-500">
                      {record.total_bouts} bout{record.total_bouts === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="font-mono text-sm">{participationRecord(record)}</p>
                </div>
                <div className="space-y-2">
                  {record.participations.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between text-sm border-t border-gray-50 pt-2"
                    >
                      <span>
                        {entry.bracket?.name ?? "Fixture"} ·{" "}
                        {entry.method ? BOUT_METHOD_LABELS[entry.method] : "—"}
                      </span>
                      <span
                        className={`badge ${
                          entry.outcome === "win"
                            ? "bg-green-100 text-green-800"
                            : entry.outcome === "loss"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {entry.outcome.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">Bout History</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No bouts yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((bout) => {
              const isWinner = bout.result?.winner_id === id;
              const opponent =
                bout.fighter_a_id === id ? bout.fighter_b : bout.fighter_a;
              return (
                <div
                  key={bout.id}
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {isWinner ? "W" : "L"} vs{" "}
                      {opponent ? fighterFullName(opponent) : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bout.result?.method
                        ? BOUT_METHOD_LABELS[bout.result.method]
                        : ""}{" "}
                      {bout.result?.round_ended
                        ? `· R${bout.result.round_ended}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      isWinner
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {isWinner ? "Win" : "Loss"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
