import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fighterFullName,
  fighterRecord,
  getAgeFromDob,
  BOUT_METHOD_LABELS,
} from "@boutforge/shared";
import { MOCK_ALL_FIGHTERS, MOCK_BOUTS } from "@/lib/mock-data";

export default async function DemoFighterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fighter = MOCK_ALL_FIGHTERS.find((f) => f.id === id);
  if (!fighter) notFound();

  const history = MOCK_BOUTS.filter(
    (b) =>
      b.status === "completed" &&
      (b.fighter_a_id === id || b.fighter_b_id === id)
  );

  return (
    <div className="space-y-6">
      <Link href="/demo/fighters" className="text-boxing text-sm hover:underline">
        ← Back to fighters
      </Link>

      <h1 className="text-2xl font-bold text-navy">{fighterFullName(fighter)}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Record</p>
          <p className="text-2xl font-bold text-navy font-mono mt-1">{fighterRecord(fighter)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Category</p>
          <p className="text-lg font-semibold text-navy mt-1">
            {fighter.age_category?.name} · {fighter.gender} · {fighter.weight_class?.name}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Details</p>
          <p className="text-sm mt-1">
            {getAgeFromDob(fighter.dob)} yrs · {fighter.weight_kg} kg · DOB {fighter.dob}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">Bout History</h2>
        {history.length === 0 ? (
          <p className="text-gray-400 text-sm">No completed bouts yet (debut fighter)</p>
        ) : (
          <div className="space-y-3">
            {history.map((bout) => {
              const isWinner = bout.result?.winner_id === id;
              const opponent =
                bout.fighter_a_id === id ? bout.fighter_b : bout.fighter_a;
              return (
                <div key={bout.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">
                      {isWinner ? "W" : "L"} vs {opponent ? fighterFullName(opponent) : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bout.result?.method ? BOUT_METHOD_LABELS[bout.result.method] : ""}{" "}
                      · R{bout.result?.round_ended}
                    </p>
                  </div>
                  <span className={`badge ${isWinner ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
