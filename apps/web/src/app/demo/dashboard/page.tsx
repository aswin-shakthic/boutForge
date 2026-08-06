import Link from "next/link";
import {
  fighterFullName,
} from "@boutforge/shared";
import { MOCK_DASHBOARD } from "@/lib/mock-data";

export default function DemoDashboardPage() {
  const stats = MOCK_DASHBOARD;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-gray-500 mt-1">Mumbai Warriors Boxing Club</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Fighters", value: stats.fighterCount },
          { label: "Upcoming Bouts", value: stats.upcomingCount },
          { label: "Active Brackets", value: stats.activeBrackets },
          { label: "Pending Results", value: stats.pendingResults },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-3xl font-bold text-navy">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/demo/fixtures/new" className="btn-primary">+ Create Fixture</Link>
        <Link href="/demo/fighters" className="btn-secondary">+ Add Fighter</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-navy mb-4">Upcoming Bouts</h2>
          <div className="space-y-3">
            {stats.upcomingBouts.map((bout) => (
              <div key={bout.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-sm">
                  {bout.fighter_a ? fighterFullName(bout.fighter_a) : "TBD"} vs{" "}
                  {bout.fighter_b ? fighterFullName(bout.fighter_b) : "TBD"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Round {bout.round_number} · Bout {bout.bout_order}
                  {bout.scheduled_at && ` · ${new Date(bout.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-navy mb-4">Recent Results</h2>
          <div className="space-y-3">
            {stats.recentResults.map((bout) => (
              <div key={bout.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-sm">
                  {bout.result?.winner_id === bout.fighter_a_id
                    ? fighterFullName(bout.fighter_a!)
                    : fighterFullName(bout.fighter_b!)}{" "}
                  def.{" "}
                  {bout.result?.winner_id === bout.fighter_a_id
                    ? fighterFullName(bout.fighter_b!)
                    : fighterFullName(bout.fighter_a!)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {bout.result?.method} · R{bout.result?.round_ended}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
