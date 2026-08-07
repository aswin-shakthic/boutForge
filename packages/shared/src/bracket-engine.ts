import type { BoutStatus, BracketPreviewBout, FighterInput, FixtureFormat } from "./types";

export function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

export function countBracketByes(fighterCount: number): number {
  return nextPowerOfTwo(fighterCount) - fighterCount;
}

type FirstRoundSlot =
  | { type: "fight"; fighterAId: string; fighterBId: string }
  | { type: "bye"; fighterId: string }
  | { type: "empty" };

type FirstRoundPlan = {
  fightGames: number;
  singleByeGames: number;
  emptyGames: number;
};

export function planFirstRound(
  fighterCount: number
): FirstRoundPlan & { bracketSize: number; gameCount: number; byeSlots: number } {
  const bracketSize = nextPowerOfTwo(fighterCount);
  const gameCount = bracketSize / 2;
  const byeSlots = bracketSize - fighterCount;

  const validPlans: Array<
    FirstRoundPlan & { bracketSize: number; gameCount: number; byeSlots: number }
  > = [];

  for (let fightGames = Math.floor(fighterCount / 2); fightGames >= 0; fightGames--) {
    const singleByeGames = fighterCount - fightGames * 2;
    if (singleByeGames < 0) continue;

    const emptyGames = gameCount - fightGames - singleByeGames;
    if (emptyGames < 0) continue;
    if (singleByeGames + emptyGames * 2 !== byeSlots) continue;

    validPlans.push({
      bracketSize,
      gameCount,
      byeSlots,
      fightGames,
      singleByeGames,
      emptyGames,
    });
  }

  if (validPlans.length === 0) {
    return {
      bracketSize,
      gameCount,
      byeSlots,
      fightGames: 0,
      singleByeGames: Math.min(fighterCount, byeSlots),
      emptyGames: Math.max(0, gameCount - Math.min(fighterCount, byeSlots)),
    };
  }

  const denseByeField = byeSlots / gameCount >= 0.875;
  if (denseByeField) {
    return validPlans.reduce((best, plan) =>
      plan.fightGames < best.fightGames ? plan : best
    );
  }

  const withStructuralEmpties = validPlans.filter((plan) => plan.emptyGames > 0);
  if (withStructuralEmpties.length > 0) {
    return withStructuralEmpties.reduce((best, plan) =>
      plan.fightGames > best.fightGames ? plan : best
    );
  }

  return validPlans.reduce((best, plan) =>
    plan.fightGames > best.fightGames ? plan : best
  );
}

function buildSlotTypeSequence(
  plan: FirstRoundPlan,
  gameCount: number
): Array<"fight" | "bye" | "empty"> {
  const sequence: Array<"fight" | "bye" | "empty"> = [];

  if (plan.fightGames > 0) {
    sequence.push("fight");
  }

  for (let i = 0; i < plan.singleByeGames; i++) {
    sequence.push("bye");
  }

  for (let i = 1; i < plan.fightGames; i++) {
    sequence.push("fight");
  }

  for (let i = 0; i < plan.emptyGames; i++) {
    sequence.push("empty");
  }

  while (sequence.length < gameCount) {
    sequence.push("empty");
  }

  return sequence;
}

export function buildFirstRoundSlots(fighters: FighterInput[]): FirstRoundSlot[] {
  const plan = planFirstRound(fighters.length);
  const sequence = buildSlotTypeSequence(plan, plan.gameCount);
  const slots: FirstRoundSlot[] = [];
  let idx = 0;

  for (const slotType of sequence) {
    if (slotType === "empty") {
      slots.push({ type: "empty" });
      continue;
    }

    if (slotType === "fight") {
      slots.push({
        type: "fight",
        fighterAId: fighters[idx].id,
        fighterBId: fighters[idx + 1].id,
      });
      idx += 2;
      continue;
    }

    slots.push({ type: "bye", fighterId: fighters[idx++].id });
  }

  return slots;
}

function orderFightersForBye(
  fighters: FighterInput[],
  byeFighterId?: string | null
): FighterInput[] {
  if (!byeFighterId) return fighters;
  const index = fighters.findIndex((f) => f.id === byeFighterId);
  if (index <= 0) return fighters;
  const next = [...fighters];
  const [byeFighter] = next.splice(index, 1);
  const firstByeIndex = buildFirstRoundSlots(fighters).findIndex((slot) => slot.type === "bye");
  if (firstByeIndex < 0) return fighters;
  const fightCount = buildFirstRoundSlots(fighters).filter((slot) => slot.type === "fight").length;
  next.splice(Math.min(fightCount * 2, next.length), 0, byeFighter);
  return next;
}

function createFirstRoundBout(
  slot: FirstRoundSlot,
  boutOrder: number
): BracketPreviewBout | null {
  if (slot.type === "empty") return null;

  if (slot.type === "fight") {
    return {
      round_number: 1,
      bout_order: boutOrder,
      fighter_a_id: slot.fighterAId,
      fighter_b_id: slot.fighterBId,
      slot_a_type: "fighter",
      slot_b_type: "fighter",
      source_bout_a_order: null,
      source_bout_b_order: null,
      winner_advances_to_order: null,
      label: `Bout ${boutOrder}`,
    };
  }

  return {
    round_number: 1,
    bout_order: boutOrder,
    fighter_a_id: slot.fighterId,
    fighter_b_id: null,
    slot_a_type: "fighter",
    slot_b_type: "bye",
    source_bout_a_order: null,
    source_bout_b_order: null,
    winner_advances_to_order: null,
    label: `Bout ${boutOrder}`,
  };
}

function buildSubsequentRounds(
  initialSources: Array<number | null>,
  bouts: BracketPreviewBout[],
  startBoutOrder: number
): number {
  let currentSources = initialSources;
  let roundNumber = 2;
  let boutOrder = startBoutOrder;

  while (true) {
    const activeSources = currentSources.filter((source): source is number => source !== null);
    if (activeSources.length <= 1) break;

    const nextSources: Array<number | null> = [];

    for (let i = 0; i < currentSources.length; i += 2) {
      const sourceA = currentSources[i] ?? null;
      const sourceB = currentSources[i + 1] ?? null;

      if (sourceA && sourceB) {
        const order = boutOrder++;
        const maxRound = Math.ceil(Math.log2(nextPowerOfTwo(activeSources.length)));
        bouts.push({
          round_number: roundNumber,
          bout_order: order,
          fighter_a_id: null,
          fighter_b_id: null,
          slot_a_type: "winner_of",
          slot_b_type: "winner_of",
          source_bout_a_order: sourceA,
          source_bout_b_order: sourceB,
          winner_advances_to_order: null,
          label: roundNumber === maxRound ? "FINAL" : `Bout ${order}`,
        });

        const boutA = bouts.find((bout) => bout.bout_order === sourceA);
        const boutB = bouts.find((bout) => bout.bout_order === sourceB);
        if (boutA) boutA.winner_advances_to_order = order;
        if (boutB) boutB.winner_advances_to_order = order;

        nextSources.push(order);
      } else if (sourceA || sourceB) {
        nextSources.push(sourceA ?? sourceB);
      } else {
        nextSources.push(null);
      }
    }

    currentSources = nextSources;
    roundNumber++;
  }

  return boutOrder;
}

export function generateProgressiveKnockoutBracket(
  fighters: FighterInput[],
  byeFighterId?: string | null
): { bouts: BracketPreviewBout[]; byeFighterId: string | null } {
  const n = fighters.length;
  if (n < 2) throw new Error("At least 2 fighters required");

  const orderedFighters = orderFightersForBye(fighters, byeFighterId);
  const slots = buildFirstRoundSlots(orderedFighters);
  const bouts: BracketPreviewBout[] = [];
  const roundSources: Array<number | null> = [];
  let boutOrder = 1;

  for (const slot of slots) {
    if (slot.type === "empty") {
      roundSources.push(null);
      continue;
    }

    const bout = createFirstRoundBout(slot, boutOrder++);
    if (!bout) continue;
    bouts.push(bout);
    roundSources.push(bout.bout_order);
  }

  buildSubsequentRounds(roundSources, bouts, boutOrder);

  const byeIds = slots
    .filter((slot): slot is Extract<FirstRoundSlot, { type: "bye" }> => slot.type === "bye")
    .map((slot) => slot.fighterId);

  return {
    bouts,
    byeFighterId: byeFighterId ?? byeIds[0] ?? null,
  };
}

export function generateRoundRobinBouts(
  fighters: FighterInput[]
): BracketPreviewBout[] {
  const bouts: BracketPreviewBout[] = [];
  let boutOrder = 1;

  for (let i = 0; i < fighters.length; i++) {
    for (let j = i + 1; j < fighters.length; j++) {
      bouts.push({
        round_number: 1,
        bout_order: boutOrder++,
        fighter_a_id: fighters[i].id,
        fighter_b_id: fighters[j].id,
        slot_a_type: "fighter",
        slot_b_type: "fighter",
        source_bout_a_order: null,
        source_bout_b_order: null,
        winner_advances_to_order: null,
        label: `Bout ${boutOrder - 1}`,
      });
    }
  }

  return bouts;
}

export function resolveInitialBoutStatus(preview: BracketPreviewBout): BoutStatus {
  if (preview.slot_a_type === "winner_of" || preview.slot_b_type === "winner_of") {
    return "pending_fighters";
  }

  const hasFighterA = preview.slot_a_type === "fighter" && preview.fighter_a_id;
  const hasFighterB =
    preview.slot_b_type === "fighter"
      ? Boolean(preview.fighter_b_id)
      : preview.slot_b_type === "bye"
        ? Boolean(preview.fighter_a_id)
        : false;

  if (hasFighterA && (hasFighterB || preview.slot_b_type === "bye")) {
    return "scheduled";
  }

  return "pending_fighters";
}

export function generateBracketBouts(
  format: FixtureFormat,
  fighters: FighterInput[],
  byeFighterId?: string | null
): { bouts: BracketPreviewBout[]; byeFighterId: string | null } {
  switch (format) {
    case "progressive_knockout":
      return generateProgressiveKnockoutBracket(fighters, byeFighterId);
    case "round_robin":
      return { bouts: generateRoundRobinBouts(fighters), byeFighterId: null };
    case "manual":
      return { bouts: [], byeFighterId: null };
    default:
      return generateProgressiveKnockoutBracket(fighters, byeFighterId);
  }
}

export function getRoundStatus(
  bouts: Array<{ round_number: number; status: string }>,
  roundNumber: number
): "locked" | "live" | "complete" {
  const roundBouts = bouts.filter((b) => b.round_number === roundNumber);
  if (roundBouts.length === 0) return "locked";
  const allComplete = roundBouts.every(
    (b) => b.status === "completed" || b.status === "cancelled"
  );
  const anyStarted = roundBouts.some(
    (b) => b.status === "completed" || b.status === "in_progress" || b.status === "scheduled"
  );
  if (allComplete) return "complete";
  if (anyStarted) return "live";
  return "locked";
}

export function canUnlockRound(
  bouts: Array<{ round_number: number; status: string }>,
  roundNumber: number
): boolean {
  if (roundNumber <= 1) return true;
  const prevRound = bouts.filter((b) => b.round_number === roundNumber - 1);
  return (
    prevRound.length > 0 &&
    prevRound.every((b) => b.status === "completed" || b.status === "cancelled")
  );
}
