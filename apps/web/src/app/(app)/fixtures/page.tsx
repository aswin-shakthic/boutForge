import { getBrackets } from "@boutforge/api";
import { FixturesGroupedList } from "@/components/FixturesGroupedList";
import { getAppContext } from "@/lib/app-context";
import Link from "next/link";

export default async function FixturesPage() {
  const { supabase, clubId } = await getAppContext();
  if (!clubId) return <p>No club</p>;

  const brackets = await getBrackets(supabase, clubId);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Fixtures</h1>
        <Link href="/fixtures/new" className="btn-primary shrink-0 text-sm sm:text-base">
          + Create Fixture
        </Link>
      </div>

      <p className="text-sm text-gray-500 -mt-2">
        Grouped by event, then age category and weight class.
      </p>

      <FixturesGroupedList brackets={brackets} />
    </div>
  );
}
