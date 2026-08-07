"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { APP_NAME } from "@boutforge/shared";
import type { ClubMember } from "@boutforge/shared";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/fighters", label: "Fighters" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/events", label: "Events" },
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
];

const ADMIN_NAV = { href: "/admin", label: "Admin" };

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
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors sm:py-2.5 ${
                pathname.startsWith(item.href)
                  ? "bg-boxing text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 sm:p-4">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:py-2"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
