"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { publishEvent } from "@boutforge/api";

export function PublishEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handlePublish() {
    await publishEvent(supabase, eventId);
    router.refresh();
  }

  return (
    <button onClick={handlePublish} className="btn-primary mt-4">
      Publish Event
    </button>
  );
}
