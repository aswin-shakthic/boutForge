import { getBracketWithBouts, getFighters } from "@boutforge/api";
import { canEditPairings, canRecordResults } from "@boutforge/shared";
import { FixtureBracketPage } from "@/components/FixtureBracketPage";
import { getAppContext } from "@/lib/app-context";
import Link from "next/link";
import { Suspense } from "react";

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, membership, clubId } = await getAppContext();
  const { bracket, bouts } = await getBracketWithBouts(supabase, id);

  const poolClubIds = new Set<string>();
  if (clubId) poolClubIds.add(clubId);
  for (const bout of bouts) {
    if (bout.fighter_a?.club_id) poolClubIds.add(bout.fighter_a.club_id);
    if (bout.fighter_b?.club_id) poolClubIds.add(bout.fighter_b.club_id);
  }

  const fighters =
    poolClubIds.size > 0
      ? await getFighters(supabase, Array.from(poolClubIds), {
          age_category_id: bracket.age_category_id ?? undefined,
          gender: bracket.gender ?? undefined,
        })
      : [];
  const canRecord = membership ? canRecordResults(membership.role) : false;
  const canEdit = membership ? canEditPairings(membership.role) : false;

  return (
    <div>
      <div className="no-print flex items-center justify-between gap-4 mb-4">
        <Link href="/fixtures" className="text-boxing text-sm hover:underline">
          ← Back to fixtures
        </Link>
      </div>
      <Suspense fallback={null}>
        <FixtureBracketPage
          bracket={bracket}
          bouts={bouts}
          fighters={fighters}
          canRecord={canRecord}
          canEdit={canEdit}
        />
      </Suspense>
    </div>
  );
}
