import { Plus } from "lucide-react";
import { getBrackets } from "@boutforge/api";
import { canEditPairings } from "@boutforge/shared";
import { FixturesGroupedList } from "@/components/FixturesGroupedList";
import { getAppContext } from "@/lib/app-context";
import { IconAction } from "@/components/ui/IconAction";

export default async function FixturesPage() {
  const { supabase, clubId, membership } = await getAppContext();
  if (!clubId) return <p>No club</p>;

  const brackets = await getBrackets(supabase, clubId);
  const canEdit = membership ? canEditPairings(membership.role) : false;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Fixtures</h1>
        <IconAction
          href="/fixtures/new"
          label="Create fixture"
          icon={Plus}
          variant="primary"
          mode="responsive"
          className="shrink-0"
        />
      </div>

      <p className="text-sm text-gray-500 -mt-2">
        Grouped by event, then age category and weight class.
      </p>

      <FixturesGroupedList brackets={brackets} canEdit={canEdit} />
    </div>
  );
}
