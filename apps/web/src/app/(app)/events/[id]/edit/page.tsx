import { EditEventForm } from "./EditEventForm";
import { getAppContext } from "@/lib/app-context";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, membership, profile, user, clubId } = await getAppContext();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_clubs(*, club:clubs(*))")
    .eq("id", id)
    .single();

  if (!event) {
    return <p>Event not found</p>;
  }

  return (
    <EditEventForm
      event={event}
      userRole={membership?.role ?? null}
      userId={user.id}
      userClubId={clubId}
      isPlatformAdmin={profile?.is_platform_admin ?? false}
    />
  );
}
