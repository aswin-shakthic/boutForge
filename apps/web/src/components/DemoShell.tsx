"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "@boutforge/shared";
import { MOCK_CLUB, MOCK_PROFILE } from "@/lib/mock-data";

const DEMO_NAV = [
  { href: "/demo", label: "Overview" },
  { href: "/demo/dashboard", label: "Dashboard" },
  { href: "/demo/fighters", label: "Fighters" },
  { href: "/demo/fixtures", label: "Fixtures" },
  { href: "/demo/fixtures/new", label: "Create Fixture" },
  { href: "/demo/events", label: "Events" },
  { href: "/demo/import", label: "Import" },
  { href: "/demo/settings", label: "Settings" },
  { href: "/demo/admin", label: "Admin" },
];

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-navy text-white min-h-screen flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">{APP_NAME}</h1>
          <p className="text-sm text-white/60 mt-1">{MOCK_CLUB.name}</p>
          <span className="inline-block mt-2 text-xs bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded">
            Demo Mode
          </span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {DEMO_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href || (item.href !== "/demo" && pathname.startsWith(item.href))
                  ? "bg-boxing text-white"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/login" className="block text-center text-sm text-white/70 hover:text-white">
            Real login →
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Mock data preview — no backend required</p>
          <div className="text-sm text-gray-600">
            {MOCK_PROFILE.full_name} · club admin
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
