import { fighterFullName, getFighterClubDisplayName } from "./constants";
import {
  getBracketDisplayName,
  getMatchGameLabel,
  organizeBoutsByRound,
  type BracketListItem,
} from "./bracket-layout";
import type { Bout, Fighter } from "./types";

export function resolveSlotFighter(
  bout: Bout,
  slot: "a" | "b",
  fighters: Fighter[]
): Fighter | null {
  const embedded = slot === "a" ? bout.fighter_a : bout.fighter_b;
  if (embedded) return embedded;
  const fighterId = slot === "a" ? bout.fighter_a_id : bout.fighter_b_id;
  if (!fighterId) return null;
  return fighters.find((f) => f.id === fighterId) ?? null;
}

function sourceLabel(bout: Bout, bouts: Bout[], slot: "a" | "b"): string {
  const sourceId = slot === "a" ? bout.source_bout_a_id : bout.source_bout_b_id;
  if (!sourceId) return "TBD";
  const source = bouts.find((b) => b.id === sourceId);
  return source ? `Winner · Game ${source.bout_order}` : "TBD";
}

export function getBoutSlotDisplayName(
  bout: Bout,
  slot: "a" | "b",
  bouts: Bout[],
  fighters: Fighter[]
): string {
  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  const fighter = resolveSlotFighter(bout, slot, fighters);
  const opponentType = slot === "a" ? bout.slot_b_type : bout.slot_a_type;

  if (slotType === "bye") {
    return fighter ? `${fighterFullName(fighter)} (BYE)` : "BYE";
  }
  if (slotType === "winner_of") return sourceLabel(bout, bouts, slot);
  if (fighter) {
    if (opponentType === "bye") return `${fighterFullName(fighter)} (BYE)`;
    return fighterFullName(fighter);
  }
  return "TBD";
}

export function getBoutSlotClubName(
  bout: Bout,
  slot: "a" | "b",
  fighters: Fighter[]
): string | null {
  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  const fighter = resolveSlotFighter(bout, slot, fighters);
  if (slotType === "winner_of" || (slotType === "bye" && !fighter)) return null;
  if (!fighter) return null;
  return getFighterClubDisplayName(fighter);
}

export type EventPrintMatchRow = {
  gameLabel: string;
  fighterA: string;
  fighterAClub: string | null;
  fighterB: string;
  fighterBClub: string | null;
};

export type EventPrintRoundGroup = {
  roundLabel: string;
  matches: EventPrintMatchRow[];
};

export type EventPrintSection = {
  bracketId: string;
  title: string;
  rounds: EventPrintRoundGroup[];
};

function collectBoutFighters(bouts: Bout[], fighters: Fighter[]): Fighter[] {
  const byId = new Map<string, Fighter>();

  for (const fighter of fighters) {
    byId.set(fighter.id, fighter);
  }

  for (const bout of bouts) {
    if (bout.fighter_a) byId.set(bout.fighter_a.id, bout.fighter_a);
    if (bout.fighter_b) byId.set(bout.fighter_b.id, bout.fighter_b);
  }

  return [...byId.values()];
}

export function buildEventPrintSections(
  brackets: BracketListItem[],
  boutsByBracketId: Map<string, Bout[]>,
  fighterPoolsByBracketId: Map<string, Fighter[]>
): EventPrintSection[] {
  const sortedBrackets = [...brackets].sort((a, b) =>
    getBracketDisplayName(a).localeCompare(getBracketDisplayName(b))
  );

  return sortedBrackets.map((bracket) => {
    const bouts = boutsByBracketId.get(bracket.id) ?? [];
    const fighters = collectBoutFighters(bouts, fighterPoolsByBracketId.get(bracket.id) ?? []);
    const { rounds } = organizeBoutsByRound(bouts);

    return {
      bracketId: bracket.id,
      title: getBracketDisplayName(bracket),
      rounds: rounds.map((round) => ({
        roundLabel: round.label,
        matches: round.bouts.map((bout) => ({
          gameLabel: getMatchGameLabel(round.label, bout.bout_order),
          fighterA: getBoutSlotDisplayName(bout, "a", bouts, fighters),
          fighterAClub: getBoutSlotClubName(bout, "a", fighters),
          fighterB: getBoutSlotDisplayName(bout, "b", bouts, fighters),
          fighterBClub: getBoutSlotClubName(bout, "b", fighters),
        })),
      })),
    };
  });
}
