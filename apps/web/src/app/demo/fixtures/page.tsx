import Link from "next/link";
import { MOCK_BRACKETS } from "@/lib/mock-data";

export default function DemoFixturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Fixtures</h1>
        <Link href="/demo/fixtures/new" className="btn-primary">+ Create Fixture</Link>
      </div>

      <div className="grid gap-4">
        {MOCK_BRACKETS.map((bracket) => (
          <Link
            key={bracket.id}
            href={`/demo/fixtures/${bracket.id}`}
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
              <span className="badge bg-blue-100 text-blue-800">{bracket.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
