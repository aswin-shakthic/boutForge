import { getEventMatchPrintData } from "@boutforge/api";
import { getAppContext } from "@/lib/app-context";
import { EventPrintAllMatches } from "@/components/EventPrintAllMatches";

export default async function EventPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const { supabase } = await getAppContext();
  const { event, sections } = await getEventMatchPrintData(supabase, id);

  return (
    <EventPrintAllMatches
      eventName={event.name}
      eventDate={event.date}
      venue={event.venue}
      sections={sections}
      autoPrint={print === "1"}
    />
  );
}
