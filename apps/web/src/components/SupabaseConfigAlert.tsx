import { isSupabaseConfigured } from "@/lib/supabase/client";

export function SupabaseConfigAlert() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 rounded-lg text-sm mb-4">
      <p className="font-medium">Authentication is not configured</p>
      <p className="mt-1">
        Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel
        environment variables, then redeploy.
      </p>
    </div>
  );
}
