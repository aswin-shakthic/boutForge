import Link from "next/link";
import {
  MOCK_ALL_FIGHTERS,
  MOCK_BRACKETS,
  MOCK_CLUB,
  MOCK_CREDENTIALS,
  MOCK_EVENTS,
  MOCK_FIGHTERS_60KG,
} from "@/lib/mock-data";
import { fighterFullName, fighterRecord } from "@boutforge/shared";

export default function DemoOverviewPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Demo Data Overview</h1>
        <p className="text-gray-500 mt-2">
          Browse every screen with realistic BFI-style mock data. No Supabase or login needed.
        </p>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-navy mb-2">Quick start</h2>
        <p className="text-sm text-gray-700">{MOCK_CREDENTIALS.note}</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/demo/dashboard", label: "Dashboard" },
            { href: "/demo/fixtures/bracket-youth-60", label: "Knockout Bracket (7 fighters)" },
            { href: "/demo/fighters/f-rahul", label: "Fighter Profile" },
            { href: "/demo/events/event-west-zone", label: "Cross-Club Event" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="btn-secondary text-center text-sm">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy mb-3">Mock club</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Club</dt>
          <dd className="font-medium">{MOCK_CLUB.name}</dd>
          <dt className="text-gray-500">State unit</dt>
          <dd>{MOCK_CLUB.state_unit}</dd>
          <dt className="text-gray-500">Coach / Admin</dt>
          <dd>{MOCK_CREDENTIALS.coach}</dd>
          <dt className="text-gray-500">Email</dt>
          <dd>{MOCK_CREDENTIALS.sampleLogin.email}</dd>
        </dl>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy mb-3">
          Youth Male 60kg — 7 fighters (knockout scenario)
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Fighter</th>
              <th>Weight</th>
              <th>Record</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FIGHTERS_60KG.map((f) => (
              <tr key={f.id} className="border-b border-gray-100">
                <td className="py-2">
                  <Link href={`/demo/fighters/${f.id}`} className="text-boxing hover:underline">
                    {fighterFullName(f)}
                  </Link>
                </td>
                <td>{f.weight_kg} kg</td>
                <td className="font-mono">{fighterRecord(f)}</td>
                <td className="text-gray-500">
                  {f.id === "f-arjun" ? "BYE in Round 1" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="card">
          <p className="text-2xl font-bold text-navy">{MOCK_ALL_FIGHTERS.length}</p>
          <p className="text-gray-500">Total fighters</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-navy">{MOCK_BRACKETS.length}</p>
          <p className="text-gray-500">Fixtures / brackets</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-navy">{MOCK_EVENTS.length}</p>
          <p className="text-gray-500">Events</p>
        </div>
      </div>
    </div>
  );
}
