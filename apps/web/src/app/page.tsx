import { redirect } from "next/navigation";
import { resolveAuthDestination } from "@boutforge/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const destination = await resolveAuthDestination(supabase);
  redirect(destination === "dashboard" ? "/dashboard" : "/onboarding");
}
