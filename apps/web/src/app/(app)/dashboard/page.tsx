import Link from "next/link";
import { UserPlus, Trophy } from "lucide-react";
import { getDashboardStats } from "@boutforge/api";
import { fighterFullName } from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";
import { IconAction } from "@/components/ui/IconAction";

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
            icon={Trophy}
            variant="primary"
            mode="responsive"
            className="flex-1 sm:flex-none"
          />
          <IconAction
            href="/fighters/new"
            label="Add fighter"
            icon={UserPlus}
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
                      {bout.fighter_a ? fighterFullName(bout.fighter_a) : "TBD"} vs{" "}
                      {bout.fighter_b ? fighterFullName(bout.fighter_b) : "TBD"}
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
            )}
          </div>
        </div>
    </div>
  );
}
