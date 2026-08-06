export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseEnv(context: string): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      `${context}: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY`
    );
  }
  return env;
}
