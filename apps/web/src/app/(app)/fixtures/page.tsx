import Link from "next/link";
import { getBrackets } from "@boutforge/api";
import { getAppContext } from "@/lib/app-context";

export default async function FixturesPage() {
  const { supabase, clubId } = await getAppContext();
  if (!clubId) return <p>No club</p>;

  const brackets = await getBrackets(supabase, clubId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Fixtures</h1>
        <Link href="/fixtures/new" className="btn-primary">
          + Create Fixture
        </Link>
      </div>

      <div className="grid gap-4">
        {brackets.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            No fixtures yet. Create your first knockout bracket.
          </div>
        ) : (
          brackets.map((bracket) => (
            <Link
              key={bracket.id}
              href={`/fixtures/${bracket.id}`}
              className="card hover:border-boxing transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-navy">{bracket.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {bracket.format.replace("_", " ")} · {bracket.status}
                    {bracket.scheduled_date && ` · ${bracket.scheduled_date}`}
                  </p>
                </div>
                <span className="badge bg-blue-100 text-blue-800">
                  {bracket.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
