import { EditFighterForm } from "./EditFighterForm";
import { getAppContext } from "@/lib/app-context";

export default async function EditFighterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAppContext();

  const { data: fighter } = await supabase
    .from("fighters")
    .select("*")
    .eq("id", id)
    .single();

  if (!fighter) {
    return <p>Fighter not found</p>;
  }

  return <EditFighterForm fighter={fighter} />;
}
