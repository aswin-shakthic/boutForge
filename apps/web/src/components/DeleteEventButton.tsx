"use client";

import { createClient } from "@/lib/supabase/client";
import { deleteEvent } from "@boutforge/api";
import { DeleteEntityButton } from "@/components/DeleteEntityButton";

export function DeleteEventButton({
  eventId,
  eventName,
  compact = false,
}: {
  eventId: string;
  eventName: string;
  compact?: boolean;
}) {
  const supabase = createClient();

  return (
    <DeleteEntityButton
      label="Delete event"
      confirmMessage={`Delete "${eventName}" and all its brackets? This cannot be undone.`}
      onDelete={() => deleteEvent(supabase, eventId)}
      redirectTo="/events"
      compact={compact}
    />
  );
}
