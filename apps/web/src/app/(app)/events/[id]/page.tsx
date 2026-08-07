import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBracketsByEvent, getEventBracketRosters } from "@boutforge/api";
import {
  canDeleteBracket as checkCanDeleteBracket,
  canDeleteEvent as checkCanDeleteEvent,
  canEditEvent as checkCanEditEvent,
  fighterFullName,
  getBracketDisplayName,
  getFighterClubDisplayName,
  groupBracketsForDisplay,
} from "@boutforge/shared";
import { getAppContext } from "@/lib/app-context";
import { DeleteEventButton } from "@/components/DeleteEventButton";
import { DeleteFixtureButton } from "@/components/DeleteFixtureButton";
import { PublishEventButton } from "./PublishEventButton";
import { IconAction } from "@/components/ui/IconAction";
import dynamic from "next/dynamic";

const EventCategoriesEditor = dynamic(
  () =>
    import("@/components/EventCategoriesEditor").then((mod) => mod.EventCategoriesEditor),
  {
    loading: () => (
      <div className="animate-pulse h-32 rounded-lg bg-gray-100" aria-hidden />
    ),
  }
);

type EventClubRow = {
  id: string;
  club: { name: string };
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, membership, profile, user, clubId, isPlatformAdmin } = await getAppContext();

  const { data: event } = await supabase
    .from("events")
    .select("*, event_clubs(*, club:clubs(*))")
    .eq("id", id)
    .single();

  if (!event) return <p>Event not found</p>;

  const [brackets, rosters] = await Promise.all([
    getBracketsByEvent(supabase, id),
    getEventBracketRosters(supabase, id),
  ]);
  const rosterByBracketId = new Map(rosters.map((roster) => [roster.bracketId, roster]));
  const bracketSections = groupBracketsForDisplay(brackets);

  const accessContext = {
    isPlatformAdmin: profile?.is_platform_admin,
    userId: user.id,
    organizerUserId: event.organizer_user_id,
    organizerClubId: event.organizer_club_id,
    userClubId: clubId,
  };
  const canEditEventAccess = checkCanEditEvent(membership?.role, accessContext);
  const canDeleteEventAccess = checkCanDeleteEvent(membership?.role, accessContext);
  const canDeleteBracketAccess = membership
    ? checkCanDeleteBracket(membership.role, isPlatformAdmin)
    : false;

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-boxing text-sm hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to events
      </Link>

      <div className="card space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title">{event.name}</h1>
            <p className="page-subtitle break-words">
              {event.date} · {event.venue ?? "TBD"} · {event.state_zone ?? ""}
            </p>
          </div>
          <span className="badge bg-blue-100 text-blue-800 self-start capitalize">
            {event.status}
          </span>
        </div>

        <div className="page-actions">
          {canEditEventAccess && (
            <IconAction
              href={`/events/${event.id}/edit`}
              label="Edit event"
              icon="pencil"
              mode="responsive"
            />
          )}
          <IconAction
            href={`/fixtures/new?eventId=${event.id}`}
            label="Add brackets"
            icon="plus"
            variant="primary"
            mode="responsive"
          />
          {brackets.length > 0 && (
            <IconAction
              href={`/events/${event.id}/print?print=1`}
              label="Print all matches"
              icon="printer"
              mode="responsive"
            />
          )}
          {event.status === "draft" && <PublishEventButton eventId={event.id} />}
          {canDeleteEventAccess ? (
            <DeleteEventButton
              eventId={event.id}
              eventName={event.name}
              compact={true}
            />
          ) : null}
        </div>

        {canEditEventAccess ? (
          <div className="border-t border-gray-100 pt-6">
            <EventCategoriesEditor eventId={event.id} />
          </div>
        ) : null}

        <div>
          <h2 className="font-semibold text-navy mb-3">Participating Clubs</h2>
          <div className="space-y-2">
            {(event.event_clubs ?? []).map((ec: EventClubRow) => (
              <div
                key={ec.id}
                className="border border-gray-100 rounded-lg p-3 text-sm"
              >
                {ec.club?.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-navy mb-3">Registered Fighters</h2>
          {bracketSections.length === 0 ? (
            <p className="text-sm text-gray-500">
              No fixtures yet. Add brackets to register fighters by category and weight class.
            </p>
          ) : (
            <div className="space-y-6">
              {bracketSections.map((section) => {
                const sectionFighters = new Map<
                  string,
                  { id: string; name: string; club: string }
                >();

                for (const bracket of section.brackets) {
                  const roster = rosterByBracketId.get(bracket.id);
                  for (const fighter of roster?.fighters ?? []) {
                    sectionFighters.set(fighter.id, {
                      id: fighter.id,
                      name: fighterFullName(fighter),
                      club: getFighterClubDisplayName(fighter),
                    });
                  }
                }

                const fighters = [...sectionFighters.values()].sort((a, b) =>
                  a.name.localeCompare(b.name)
                );

                return (
                  <section
                    key={section.key}
                    className="border border-gray-100 rounded-lg p-4 space-y-3"
                  >
                    <div>
                      <h3 className="font-medium text-navy">{section.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{section.subtitle}</p>
                    </div>
                    {fighters.length === 0 ? (
                      <p className="text-sm text-gray-400">No fighters assigned yet.</p>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {fighters.map((fighter) => (
                          <li
                            key={fighter.id}
                            className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="text-sm font-medium text-navy">{fighter.name}</span>
                            <span className="text-xs text-gray-500">{fighter.club}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.brackets.length === 1 ? (
                      <Link
                        href={`/fixtures/${section.brackets[0].id}`}
                        className="inline-flex text-xs text-boxing hover:underline"
                      >
                        View bracket
                      </Link>
                    ) : null}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-navy mb-3">
            Brackets ({brackets.length})
          </h2>
          {brackets.length === 0 ? (
            <p className="text-sm text-gray-500">
              No brackets yet. Use &quot;Add brackets&quot; to create fixtures for this event.
            </p>
          ) : (
            <div className="space-y-6">
              {bracketSections.map((section) => (
                <section key={section.key} className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium text-navy">{section.title}</h3>
                    <p className="text-xs text-gray-500 capitalize">{section.subtitle}</p>
                  </div>
                  <div className="space-y-2">
                    {section.brackets.map((bracket) => {
                      const roster = rosterByBracketId.get(bracket.id);
                      const displayName = getBracketDisplayName(bracket);
                      return (
                        <div
                          key={bracket.id}
                          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-gray-100 rounded-lg p-3 text-sm hover:border-boxing/30 hover:bg-gray-50"
                        >
                          <Link href={`/fixtures/${bracket.id}`} className="min-w-0 flex-1">
                            <p className="font-medium text-navy">{displayName}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {roster?.fighters.length ?? 0} fighter
                              {(roster?.fighters.length ?? 0) === 1 ? "" : "s"}
                            </p>
                          </Link>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="badge bg-gray-100 text-gray-700 capitalize">
                              {bracket.status}
                            </span>
                            <IconAction
                              href={`/fixtures/${bracket.id}`}
                              label="View bracket"
                              icon="trophy"
                              variant="ghost"
                            />
                            {canEditEventAccess && (
                              <IconAction
                                href={`/fixtures/${bracket.id}/edit`}
                                label="Edit fixture"
                                icon="pencil"
                                variant="ghost"
                              />
                            )}
                            {canDeleteBracketAccess && (
                              <DeleteFixtureButton
                                bracketId={bracket.id}
                                bracketName={displayName}
                                compact
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {canDeleteEventAccess ? (
          <div className="border-t border-red-100 pt-6 space-y-3">
            <h2 className="font-semibold text-navy">Danger zone</h2>
            <p className="text-sm text-gray-500">
              Deleting this event removes all brackets, fixtures, and bout results linked to it.
            </p>
            <DeleteEventButton eventId={event.id} eventName={event.name} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
