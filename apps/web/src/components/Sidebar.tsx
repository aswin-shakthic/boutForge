"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
}: {
  membership: ClubMember | null;
  isPlatformAdmin?: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items = isPlatformAdmin ? [...NAV_ITEMS, ADMIN_NAV] : NAV_ITEMS;

  return (
    <aside className="w-64 bg-navy text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">{APP_NAME}</h1>
        <p className="text-sm text-white/60 mt-1 truncate">
          {membership?.club?.name ?? "No club"}
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-boxing text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
