import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

// Valid-format placeholders so build/prerender can complete without env vars.
// Real auth requires NEXT_PUBLIC_* set at build time on Vercel.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDEwNDExMDAsImV4cCI6MTk1NjYxNzEwMH0.placeholder";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (client) return client;

  const env = getSupabaseEnv();
  client = createBrowserClient(
    env?.url ?? PLACEHOLDER_URL,
    env?.anonKey ?? PLACEHOLDER_ANON_KEY
  );
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
