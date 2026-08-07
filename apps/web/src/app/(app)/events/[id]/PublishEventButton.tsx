"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
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
      className="btn-primary text-sm gap-2"
      disabled={loading}
      title="Publish event"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Send className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="hidden sm:inline">{loading ? "Publishing…" : "Publish event"}</span>
      <span className="sm:hidden">{loading ? "…" : "Publish"}</span>
    </button>
  );
}
