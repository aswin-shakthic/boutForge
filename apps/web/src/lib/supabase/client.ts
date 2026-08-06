import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

export function createClient() {
  const env = requireSupabaseEnv("createClient");
  return createBrowserClient(env.url, env.anonKey);
}
