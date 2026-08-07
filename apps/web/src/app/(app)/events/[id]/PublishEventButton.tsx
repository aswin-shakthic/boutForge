"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { publishEvent } from "@boutforge/api";

export function PublishEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handlePublish() {
    setLoading(true);
    try {
      await publishEvent(supabase, eventId);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePublish}
      className="btn-primary mt-4"
      disabled={loading}
    >
      {loading ? "Publishing…" : "Publish Event"}
    </button>
  );
}
