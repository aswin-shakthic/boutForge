"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_NAME } from "@boutforge/shared";
import type { ClubMember } from "@boutforge/shared";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fighters", label: "Fighters", icon: Users },
  { href: "/fixtures", label: "Fixtures", icon: Trophy },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV = { href: "/admin", label: "Admin", icon: Shield };

export function Sidebar({
  membership,
  isPlatformAdmin,
  onLogout,
  mobileOpen = false,
  onClose,
}: {
  membership: ClubMember | null;
  isPlatformAdmin?: boolean;
  onLogout: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const items = isPlatformAdmin ? [...NAV_ITEMS, ADMIN_NAV] : NAV_ITEMS;

  useEffect(() => {
    onClose?.();
  }, [pathname, onClose]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,16rem)] flex-col bg-navy text-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg font-bold sm:text-xl">{APP_NAME}</h1>
              <p className="mt-1 truncate text-sm text-white/60">
                {membership?.club?.name ?? "No club"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors sm:py-2.5 ${
                  active
                    ? "bg-boxing text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 sm:p-4">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:py-2"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
