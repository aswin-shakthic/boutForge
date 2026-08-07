import { NextResponse } from "next/server";
import { completePendingSignup, resolveAuthDestination } from "@boutforge/api";
import { createClient } from "@/lib/supabase/server";
import { getRequestAppUrl } from "@/lib/app-url";

function safeRedirectPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const appUrl = getRequestAppUrl(request);

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        await completePendingSignup(supabase);
        const destination = await resolveAuthDestination(supabase);
        const path = destination === "dashboard" ? next : "/onboarding";
        return NextResponse.redirect(`${appUrl}${path}`);
      }
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
}
