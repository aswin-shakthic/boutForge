import { ArrowLeft } from "lucide-react";
import { getBracketWithBouts, getFighters } from "@boutforge/api";
import { canDeleteBracket, canEditPairings, canRecordResults } from "@boutforge/shared";
import { FixtureBracketPage } from "@/components/FixtureBracketPage";
import { DeleteFixtureButton } from "@/components/DeleteFixtureButton";
import { getAppContext } from "@/lib/app-context";
import { IconAction } from "@/components/ui/IconAction";
import Link from "next/link";
import { Suspense } from "react";

export default async function FixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, membership, clubId, isPlatformAdmin } = await getAppContext();
  const { bracket, bouts, displayName } = await getBracketWithBouts(supabase, id);

  const poolClubIds = new Set<string>();
  if (clubId) poolClubIds.add(clubId);
  for (const bout of bouts) {
    if (bout.fighter_a?.club_id) poolClubIds.add(bout.fighter_a.club_id);
    if (bout.fighter_b?.club_id) poolClubIds.add(bout.fighter_b.club_id);
  }

  if (bracket.event_id) {
    const { data: eventClubs } = await supabase
      .from("event_clubs")
      .select("club_id")
      .eq("event_id", bracket.event_id);
    for (const row of eventClubs ?? []) {
      poolClubIds.add(row.club_id);
    }
  }

  const fighters =
    poolClubIds.size > 0
      ? await getFighters(supabase, Array.from(poolClubIds), {
          age_category_id: bracket.age_category_id ?? undefined,
          gender: bracket.gender ?? undefined,
          weight_class_id: bracket.weight_class_id ?? undefined,
        })
      : [];
  const canRecord = membership ? canRecordResults(membership.role) : false;
  const canEdit = membership ? canEditPairings(membership.role) : false;
  const canDelete = membership
    ? canDeleteBracket(membership.role, isPlatformAdmin)
    : false;

  return (
    <div>
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link
          href="/fixtures"
          className="inline-flex items-center gap-1.5 text-boxing text-sm hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to fixtures
        </Link>
        {(canEdit || canDelete) && (
          <div className="flex flex-wrap items-center gap-1">
            {canEdit && (
              <IconAction
                href={`/fixtures/${id}/edit`}
                label="Edit fixture"
                icon="pencil"
                mode="responsive"
              />
            )}
            {canDelete && (
              <DeleteFixtureButton
                bracketId={bracket.id}
                bracketName={displayName}
                compact
              />
            )}
          </div>
        )}
      </div>
      <Suspense fallback={null}>
        <FixtureBracketPage
          bracket={bracket}
          bouts={bouts}
          fighters={fighters}
          canRecord={canRecord}
          canEdit={canEdit}
          displayName={displayName}
        />
      </Suspense>
      {canDelete && (
        <div className="no-print card border-red-100 mt-8 space-y-3">
          <h2 className="font-semibold text-navy">Danger zone</h2>
          <p className="text-sm text-gray-500">
            Deleting this fixture removes all bouts and results in this bracket.
          </p>
          <DeleteFixtureButton bracketId={bracket.id} bracketName={displayName} />
        </div>
      )}
    </div>
  );
}
