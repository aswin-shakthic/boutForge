import { getBracketWithBouts } from "@boutforge/api";
import { EditFixtureForm } from "./EditFixtureForm";
import { getAppContext } from "@/lib/app-context";

export default async function EditFixturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await getAppContext();
  const { bracket } = await getBracketWithBouts(supabase, id);

  return <EditFixtureForm bracket={bracket} />;
}
