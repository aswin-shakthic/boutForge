import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserClubs } from "@boutforge/api";
import { AppShell } from "@/components/AppShell";

export async function getAppContext() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, clubs] = await Promise.all([
    getProfile(supabase, user.id),
    getUserClubs(supabase, user.id),
  ]);

  const membership = clubs[0] ?? null;

  if (!membership && !profile?.is_platform_admin) {
    redirect("/onboarding");
  }

  return {
    supabase,
    user,
    profile,
    membership,
    memberships: clubs,
    clubIds: clubs.map((entry) => entry.club_id),
    isPlatformAdmin: profile?.is_platform_admin ?? false,
    clubId: membership?.club_id ?? null,
  };
}

export async function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { membership, isPlatformAdmin } = await getAppContext();

  return (
    <AppShell membership={membership} isPlatformAdmin={isPlatformAdmin}>
      {children}
    </AppShell>
  );
}
