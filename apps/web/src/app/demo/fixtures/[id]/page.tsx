import Link from "next/link";
import { notFound } from "next/navigation";
import { BracketView } from "@/components/BracketView";
import { MOCK_BRACKETS, MOCK_BOUTS, MOCK_FIGHTERS_60KG } from "@/lib/mock-data";

export default async function DemoFixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bracket = MOCK_BRACKETS.find((b) => b.id === id);
  if (!bracket) notFound();

  const bouts = id === "bracket-youth-60" ? MOCK_BOUTS : [];

  return (
    <div>
      <Link href="/demo/fixtures" className="text-boxing text-sm hover:underline">
        ← Back to fixtures
      </Link>
      <div className="mt-4">
        {bouts.length > 0 ? (
          <BracketView
            bracket={bracket}
            bouts={bouts}
            fighters={MOCK_FIGHTERS_60KG}
            canRecord={true}
            canEdit={true}
            isDemo={true}
          />
        ) : (
          <div className="card mt-4">
            <h2 className="font-semibold text-navy">{bracket.name}</h2>
            <p className="text-gray-500 text-sm mt-2">Round-robin fixture — preview coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
