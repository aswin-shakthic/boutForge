"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      <Sidebar
        membership={membership}
        isPlatformAdmin={isPlatformAdmin}
        onLogout={handleLogout}
        mobileOpen={mobileNavOpen}
        onClose={closeMobileNav}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg border border-gray-200 p-2 text-navy hover:bg-gray-50 lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <p className="truncate text-sm font-medium text-navy lg:hidden">
              {membership?.club?.name ?? "BoutForge"}
            </p>
          </div>
          <div className="shrink-0 text-xs capitalize text-gray-600 sm:text-sm">
            {membership?.role?.replace("_", " ") ?? "Guest"}
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
