import { getAllClubs } from "@boutforge/api";
import { getAppContext } from "@/lib/app-context";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const { supabase, isPlatformAdmin } = await getAppContext();

  if (!isPlatformAdmin) {
    redirect("/dashboard");
  }

  const clubs = await getAllClubs(supabase);

  const { data: categories } = await supabase
    .from("age_categories")
    .select("*, weight_classes(*)")
    .is("club_id", null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Platform Admin</h1>

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">All Clubs ({clubs.length})</h2>
        <div className="space-y-2">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
            >
              <div>
                <p className="font-medium text-sm">{club.name}</p>
                <p className="text-xs text-gray-500">{club.state_unit ?? "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-navy mb-4">
          BFI/IBA Categories ({categories?.length ?? 0} age groups)
        </h2>
        <div className="space-y-4">
          {(categories ?? []).map(
            (cat: {
              id: string;
              name: string;
              weight_classes: { name: string; gender: string }[];
            }) => (
              <div key={cat.id}>
                <h3 className="font-medium text-sm text-navy">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {(cat.weight_classes ?? [])
                    .map((wc) => `${wc.gender}: ${wc.name}`)
                    .join(" · ")}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
