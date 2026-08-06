import { redirect } from "next/navigation";
import { completePendingSignup, getUserClubs } from "@boutforge/api";
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

  await completePendingSignup(supabase);
  const clubs = await getUserClubs(supabase, user.id);

  if (clubs.length > 0) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}
