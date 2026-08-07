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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Fixtures</h1>
          <p className="text-sm text-gray-500 mt-1">
            Grouped by age category and weight class. Open any bracket to view or print.
          </p>
        </div>
        <Link href="/fixtures/new" className="btn-primary shrink-0">
          + Create Fixture
        </Link>
      </div>

      <FixturesGroupedList brackets={brackets} />
    </div>
  );
}
