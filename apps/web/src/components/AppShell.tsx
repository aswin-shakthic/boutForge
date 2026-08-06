"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import type { ClubMember } from "@boutforge/shared";

export function AppShell({
  children,
  membership,
  isPlatformAdmin,
}: {
  children: React.ReactNode;
  membership: ClubMember | null;
  isPlatformAdmin?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        membership={membership}
        isPlatformAdmin={isPlatformAdmin}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div />
          <div className="text-sm text-gray-600">
            {membership?.role?.replace("_", " ") ?? "Guest"}
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
