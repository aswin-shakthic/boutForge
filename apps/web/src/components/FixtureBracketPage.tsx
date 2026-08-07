"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Bout, Bracket, Fighter } from "@boutforge/shared";

const BracketView = dynamic(
  () => import("@/components/BracketView").then((mod) => mod.BracketView),
  {
    loading: () => (
      <div className="card animate-pulse h-96 flex items-center justify-center text-gray-400">
        Loading bracket…
      </div>
    ),
  }
);

export function FixtureBracketPage({
  bracket,
  bouts,
  fighters,
  canRecord,
  canEdit,
  displayName,
}: {
  bracket: Bracket;
  bouts: Bout[];
  fighters: Fighter[];
  canRecord: boolean;
  canEdit: boolean;
  displayName?: string;
}) {
  const searchParams = useSearchParams();
  const shouldPrint = searchParams.get("print") === "1";

  useEffect(() => {
    if (!shouldPrint) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [shouldPrint]);

  return (
    <BracketView
      bracket={bracket}
      bouts={bouts}
      fighters={fighters}
      canRecord={canRecord}
      canEdit={canEdit}
      displayName={displayName}
    />
  );
}
