import Link from "next/link";
import {
  fighterFullName,
  fighterRecord,
  getAgeFromDob,
} from "@boutforge/shared";
import { MOCK_ALL_FIGHTERS } from "@/lib/mock-data";

export default function DemoFightersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Fighters</h1>
        <div className="flex gap-3">
          <Link href="/demo/import" className="btn-secondary">Import CSV</Link>
          <span className="btn-primary opacity-50 cursor-not-allowed">+ Add Fighter</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["All", "Youth", "Male", "60kg"].map((chip) => (
          <span key={chip} className="badge bg-gray-100 text-gray-700 px-3 py-1">{chip}</span>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Record</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_ALL_FIGHTERS.map((fighter) => (
              <tr key={fighter.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-sm">{fighterFullName(fighter)}</p>
                  <p className="text-xs text-gray-500">
                    {getAgeFromDob(fighter.dob)} yrs · {fighter.gender}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="badge bg-blue-100 text-blue-800">{fighter.age_category?.name}</span>{" "}
                  <span className="badge bg-gray-100 text-gray-700">{fighter.weight_class?.name}</span>
                </td>
                <td className="px-6 py-4 text-sm">{fighter.weight_kg} kg</td>
                <td className="px-6 py-4 text-sm font-mono">{fighterRecord(fighter)}</td>
                <td className="px-6 py-4">
                  <Link href={`/demo/fighters/${fighter.id}`} className="text-boxing text-sm hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
