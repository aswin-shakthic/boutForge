"use client";

import { createClient } from "@/lib/supabase/client";
import { deleteFighter } from "@boutforge/api";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export function DeleteFighterButton({
  fighterId,
  fighterName,
  disabled,
}: {
  fighterId: string;
  fighterName: string;
  disabled?: boolean;
}) {
  const supabase = createClient();

  return (
    <DeleteEntityButton
      label="Delete fighter"
      confirmMessage={`Delete ${fighterName}? Fighters linked to bouts cannot be removed.`}
      onDelete={() => deleteFighter(supabase, fighterId)}
      redirectTo="/fighters"
      disabled={disabled}
    />
  );
}
