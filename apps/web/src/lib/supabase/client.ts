import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!client) {
    client = createBrowserClient(env.url, env.anonKey);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
