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

type BuildContext = {
  bouts: BracketPreviewBout[];
  boutOrder: number;
};

function pushBout(
  ctx: BuildContext,
  bout: Omit<BracketPreviewBout, "bout_order" | "label">
): number {
  const order = ctx.boutOrder++;
  ctx.bouts.push({
    ...bout,
    bout_order: order,
    label: `Bout ${order}`,
  });
  return order;
}

function linkAdvancement(
  ctx: BuildContext,
  sourceOrder: number,
  targetOrder: number
): void {
  const source = ctx.bouts.find((b) => b.bout_order === sourceOrder);
  if (source) source.winner_advances_to_order = targetOrder;
}

function createFightBout(
  ctx: BuildContext,
  roundNumber: number,
  fighterAId: string,
  fighterBId: string
): number {
  return pushBout(ctx, {
    round_number: roundNumber,
    fighter_a_id: fighterAId,
    fighter_b_id: fighterBId,
    slot_a_type: "fighter",
    slot_b_type: "fighter",
    source_bout_a_order: null,
    source_bout_b_order: null,
    winner_advances_to_order: null,
  });
}

function createWinnerFightBout(
  ctx: BuildContext,
  roundNumber: number,
  sourceAOrder: number,
  sourceBOrder: number
): number {
  const order = pushBout(ctx, {
    round_number: roundNumber,
    fighter_a_id: null,
    fighter_b_id: null,
    slot_a_type: "winner_of",
    slot_b_type: "winner_of",
    source_bout_a_order: sourceAOrder,
    source_bout_b_order: sourceBOrder,
    winner_advances_to_order: null,
  });
  linkAdvancement(ctx, sourceAOrder, order);
  linkAdvancement(ctx, sourceBOrder, order);
  return order;
}

function createWinnerVsFighterBout(
  ctx: BuildContext,
  roundNumber: number,
  sourceOrder: number,
  fighterId: string
): number {
  const order = pushBout(ctx, {
    round_number: roundNumber,
    fighter_a_id: null,
    fighter_b_id: fighterId,
    slot_a_type: "winner_of",
    slot_b_type: "fighter",
    source_bout_a_order: sourceOrder,
    source_bout_b_order: null,
    winner_advances_to_order: null,
  });
  linkAdvancement(ctx, sourceOrder, order);
  return order;
}

function buildStandardRound(
  ctx: BuildContext,
  roundNumber: number,
  sourceOrders: number[]
): number[] {
  if (sourceOrders.length <= 1) return sourceOrders;

  const nextOrders: number[] = [];
  for (let i = 0; i < sourceOrders.length; i += 2) {
    const sourceA = sourceOrders[i];
    const sourceB = sourceOrders[i + 1];
    if (sourceB === undefined) {
      nextOrders.push(sourceA);
      continue;
    }
    nextOrders.push(createWinnerFightBout(ctx, roundNumber, sourceA, sourceB));
  }

  if (nextOrders.length <= 1) return nextOrders;
  return buildStandardRound(ctx, roundNumber + 1, nextOrders);
}

function buildProgressiveStage(
  ctx: BuildContext,
  fighters: FighterInput[],
  stageSize: number,
  roundNumber: number
): number[] {
  const n = fighters.length;

  if (n <= 2) {
    if (n === 2) {
      return [createFightBout(ctx, roundNumber, fighters[0].id, fighters[1].id)];
    }
    return [];
  }

  if (n === stageSize * 2) {
    const sourceOrders: number[] = [];
    for (let i = 0; i < n; i += 2) {
      sourceOrders.push(createFightBout(ctx, roundNumber, fighters[i].id, fighters[i + 1].id));
    }
    return buildStandardRound(ctx, roundNumber + 1, sourceOrders);
  }

  if (n > stageSize && n < stageSize * 2) {
    const prelimCount = n - stageSize;
    const prelimOrders: number[] = [];

    for (let i = 0; i < prelimCount; i++) {
      prelimOrders.push(
        createFightBout(
          ctx,
          roundNumber,
          fighters[i * 2].id,
          fighters[i * 2 + 1].id
        )
      );
    }

    const waiting = fighters.slice(prelimCount * 2);
    const stageRound = roundNumber + 1;
    const stageOrders: number[] = [];
    const trailingWaiting = waiting.slice(prelimCount);

    for (let i = 0; i + 1 < trailingWaiting.length; i += 2) {
      stageOrders.push(
        createFightBout(
          ctx,
          stageRound,
          trailingWaiting[i].id,
          trailingWaiting[i + 1].id
        )
      );
    }

    for (let i = 0; i < Math.min(prelimCount, waiting.length); i++) {
      stageOrders.push(
        createWinnerVsFighterBout(ctx, stageRound, prelimOrders[i], waiting[i].id)
      );
    }

    const unpairedQualWinners = prelimOrders.slice(waiting.length);
    for (let i = 0; i + 1 < unpairedQualWinners.length; i += 2) {
      stageOrders.push(
        createWinnerFightBout(ctx, stageRound, unpairedQualWinners[i], unpairedQualWinners[i + 1])
      );
    }

    return buildStandardRound(ctx, stageRound + 1, stageOrders);
  }

  if (n === stageSize) {
    const sourceOrders: number[] = [];
    for (let i = 0; i < n; i += 2) {
      sourceOrders.push(createFightBout(ctx, roundNumber, fighters[i].id, fighters[i + 1].id));
    }
    return buildStandardRound(ctx, roundNumber + 1, sourceOrders);
  }

  return [];
}

function resolveStageSize(fighterCount: number): number {
  if (fighterCount <= 4) return 2;
  if (fighterCount <= 8) return 4;
  if (fighterCount <= 16) return 8;
  return 16;
}

function orderFightersForBye(
  fighters: FighterInput[],
  byeFighterId?: string | null
): FighterInput[] {
  if (!byeFighterId) return fighters;

  const byeIndex = fighters.findIndex((f) => f.id === byeFighterId);
  if (byeIndex < 0) return fighters;

  const n = fighters.length;
  if (n <= 4) return fighters;

  const stageSize = resolveStageSize(n);
  if (n <= stageSize || n >= stageSize * 2) return fighters;

  const prelimCount = n - stageSize;
  const byeSlotIndex = prelimCount * 2;
  if (byeIndex === byeSlotIndex) return fighters;

  const next = [...fighters];
  const [byeFighter] = next.splice(byeIndex, 1);
  next.splice(byeSlotIndex, 0, byeFighter);
  return next;
}

function detectByeFighterId(
  fighters: FighterInput[],
  bouts: BracketPreviewBout[]
): string | null {
  const stageSize = resolveStageSize(fighters.length);
  const n = fighters.length;
  if (n <= stageSize || n >= stageSize * 2) return null;

  const prelimCount = n - stageSize;
  const byeCandidate = fighters[prelimCount * 2];
  const hasByeSlot = bouts.some(
    (bout) =>
      bout.slot_a_type === "winner_of" &&
      bout.slot_b_type === "fighter" &&
      bout.fighter_b_id === byeCandidate?.id
  );
  return hasByeSlot ? byeCandidate?.id ?? null : null;
}

export function buildFirstRoundSlots(fighters: FighterInput[]): Array<
  | { type: "fight"; fighterAId: string; fighterBId: string }
  | { type: "bye"; fighterId: string }
  | { type: "empty" }
> {
  const n = fighters.length;
  if (n <= 1) return [];

  const stageSize = resolveStageSize(n);

  if (n === stageSize * 2) {
    const slots: Array<{ type: "fight"; fighterAId: string; fighterBId: string }> = [];
    for (let i = 0; i < n; i += 2) {
      slots.push({
        type: "fight",
        fighterAId: fighters[i].id,
        fighterBId: fighters[i + 1].id,
      });
    }
    return slots;
  }

  if (n > stageSize && n < stageSize * 2) {
    const prelimCount = n - stageSize;
    const slots: Array<{ type: "fight"; fighterAId: string; fighterBId: string }> = [];

    for (let i = 0; i < prelimCount; i++) {
      slots.push({
        type: "fight",
        fighterAId: fighters[i * 2].id,
        fighterBId: fighters[i * 2 + 1].id,
      });
    }

    return slots;
  }

  const slots: Array<{ type: "fight"; fighterAId: string; fighterBId: string }> = [];
  for (let i = 0; i + 1 < n; i += 2) {
    slots.push({
      type: "fight",
      fighterAId: fighters[i].id,
      fighterBId: fighters[i + 1].id,
    });
  }
  return slots;
}

export function planFirstRound(fighterCount: number): {
  bracketSize: number;
  gameCount: number;
  byeSlots: number;
  fightGames: number;
  singleByeGames: number;
  emptyGames: number;
} {
  const bracketSize = nextPowerOfTwo(fighterCount);
  const slots = buildFirstRoundSlots(
    Array.from({ length: fighterCount }, (_, i) => ({
      id: `f${i + 1}`,
      first_name: "Test",
      last_name: `Fighter${i + 1}`,
      dob: "2010-01-01",
      gender: "male" as const,
      weight_kg: 50,
      wins: 0,
      losses: 0,
      draws: 0,
      last_bout_at: null,
    }))
  );

  return {
    bracketSize,
    gameCount: slots.length,
    byeSlots: countBracketByes(fighterCount),
    fightGames: slots.filter((slot) => slot.type === "fight").length,
    singleByeGames: slots.filter((slot) => slot.type === "bye").length,
    emptyGames: slots.filter((slot) => slot.type === "empty").length,
  };
}

export function generateProgressiveKnockoutBracket(
  fighters: FighterInput[],
  byeFighterId?: string | null
): { bouts: BracketPreviewBout[]; byeFighterId: string | null } {
  const n = fighters.length;
  if (n < 2) throw new Error("At least 2 fighters required");

  const orderedFighters = orderFightersForBye(fighters, byeFighterId);
  const ctx: BuildContext = { bouts: [], boutOrder: 1 };
  const stageSize = resolveStageSize(n);

  if (n <= 4) {
    buildProgressiveStage(ctx, orderedFighters, 2, 1);
  } else {
    buildProgressiveStage(ctx, orderedFighters, stageSize, 1);
  }

  const maxRound = Math.max(...ctx.bouts.map((b) => b.round_number));
  for (const bout of ctx.bouts) {
    if (bout.round_number === maxRound && bout.slot_a_type === "winner_of") {
      bout.label = "FINAL";
    }
  }

  return {
    bouts: ctx.bouts,
    byeFighterId: byeFighterId ?? detectByeFighterId(orderedFighters, ctx.bouts),
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
