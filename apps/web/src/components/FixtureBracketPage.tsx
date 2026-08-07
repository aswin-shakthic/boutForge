"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BracketView } from "@/components/BracketView";
import type { Bout, Bracket, Fighter } from "@boutforge/shared";

export function FixtureBracketPage({
  bracket,
  bouts,
  fighters,
  canRecord,
  canEdit,
}: {
  bracket: Bracket;
  bouts: Bout[];
  fighters: Fighter[];
  canRecord: boolean;
  canEdit: boolean;
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
    />
  );
}
