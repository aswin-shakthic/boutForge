"use client";

import { createClient } from "@/lib/supabase/client";
import { deleteBracket } from "@boutforge/api";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export function DeleteFixtureButton({
  bracketId,
  bracketName,
  compact = false,
}: {
  bracketId: string;
  bracketName: string;
  compact?: boolean;
}) {
  const supabase = createClient();

  return (
    <DeleteEntityButton
      label="Delete fixture"
      confirmMessage={`Delete "${bracketName}"? This cannot be undone.`}
      onDelete={() => deleteBracket(supabase, bracketId)}
      redirectTo="/fixtures"
      compact={compact}
    />
  );
}
