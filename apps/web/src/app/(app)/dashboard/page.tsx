import Link from "next/link";
import { getDashboardStats } from "@boutforge/api";
import { BOUT_METHOD_LABELS, fighterFullName } from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";
import { IconAction } from "@/components/ui/IconAction";

function boutFighterLabel(
  fighter: { first_name: string; last_name: string } | null | undefined
): string {
  return fighter ? fighterFullName(fighter) : "Unknown";
}

export default async function DashboardPage() {
  const { supabase, clubId, membership } = await getAppContext();

  if (!clubId) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-xl font-semibold text-navy mb-2">No club found</h2>
        <p className="text-gray-500 mb-4">Create or join a club to get started.</p>
        <a href="/onboarding" className="btn-primary inline-block">
          Finish setup
        </a>
      </div>
    );
  }

  const stats = await getDashboardStats(supabase, clubId);

  return (
    <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{membership?.club?.name}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Fighters", value: stats.fighterCount },
            { label: "Upcoming Bouts", value: stats.upcomingCount },
            { label: "Active Brackets", value: stats.activeBrackets },
            { label: "Pending Results", value: 0 },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-2xl font-bold text-navy sm:text-3xl">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="page-actions">
          <IconAction
            href="/fixtures/new"
            label="Create fixture"
            icon="trophy"
            variant="primary"
            mode="responsive"
            className="flex-1 sm:flex-none"
          />
          <IconAction
            href="/fighters/new"
            label="Add fighter"
            icon="userPlus"
            mode="responsive"
            className="flex-1 sm:flex-none"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-navy mb-4">Upcoming Bouts</h2>
            {stats.upcomingBouts.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming bouts</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingBouts.map((bout) => (
                  <div key={bout.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="font-medium text-sm">
                      {boutFighterLabel(bout.fighter_a)} vs {boutFighterLabel(bout.fighter_b)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Round {bout.round_number} · Bout {bout.bout_order}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-navy mb-4">Recent Results</h2>
            {stats.recentResults.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent results</p>
            ) : (
              <div className="space-y-3">
                {stats.recentResults.map((bout) => {
                  const winnerIsA = bout.result?.winner_id === bout.fighter_a_id;
                  const winner = winnerIsA ? bout.fighter_a : bout.fighter_b;
                  const loser = winnerIsA ? bout.fighter_b : bout.fighter_a;
                  const method = bout.result?.method
                    ? BOUT_METHOD_LABELS[bout.result.method] ?? bout.result.method
                    : null;

                  return (
                    <div key={bout.id} className="border border-gray-100 rounded-lg p-3">
                      <p className="font-medium text-sm">
                        {boutFighterLabel(winner)} def. {boutFighterLabel(loser)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {method ?? "Result recorded"}
                        {bout.result?.round_ended ? ` · R${bout.result.round_ended}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
