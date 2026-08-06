import { MOCK_CLUBS, MOCK_CATEGORIES } from "@/lib/mock-data";

export default function DemoAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Platform Admin</h1>

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">All Clubs ({MOCK_CLUBS.length})</h2>
        <div className="space-y-2">
          {MOCK_CLUBS.map((club) => (
            <div key={club.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
              <div>
                <p className="font-medium text-sm">{club.name}</p>
                <p className="text-xs text-gray-500">{club.state_unit ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">BFI/IBA Categories</h2>
        <div className="space-y-4">
          {MOCK_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <h3 className="font-medium text-sm text-navy">{cat.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{cat.weight_classes.join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
