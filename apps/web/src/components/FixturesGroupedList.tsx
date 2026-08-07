import Link from "next/link";
import { groupBracketsForDisplay, type BracketListItem } from "@boutforge/shared";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function FixturesGroupedList({ brackets }: { brackets: BracketListItem[] }) {
  const groups = groupBracketsForDisplay(brackets);

  if (groups.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        No fixtures yet. Create your first knockout bracket.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-4">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-semibold text-navy">{group.title}</h2>
            {group.subtitle && <p className="text-sm text-gray-500 mt-0.5">{group.subtitle}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {group.brackets.map((bracket) => (
              <article
                key={bracket.id}
                className="card hover:border-boxing transition-colors flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-navy">{bracket.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {formatLabel(bracket.format)} · {formatLabel(bracket.status)}
                      {bracket.scheduled_date ? ` · ${bracket.scheduled_date}` : ""}
                    </p>
                  </div>
                  <span className="badge bg-blue-100 text-blue-800 shrink-0">
                    {formatLabel(bracket.status)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/fixtures/${bracket.id}`} className="btn-primary text-sm">
                    View bracket
                  </Link>
                  <Link
                    href={`/fixtures/${bracket.id}?print=1`}
                    className="btn-secondary text-sm"
                  >
                    Print
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
