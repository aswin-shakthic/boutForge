import type { BoutStatus, BracketPreviewBout, FighterInput, FixtureFormat } from "./types";

interface PairingScore {
  fighterAId: string;
  fighterBId: string;
  score: number;
  reason: string;
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function scorePairing(a: FighterInput, b: FighterInput): PairingScore {
  const recordDiff = Math.abs(
    a.wins + a.losses + a.draws - (b.wins + b.losses + b.draws)
  );
  const restA = daysSince(a.last_bout_at);
  const restB = daysSince(b.last_bout_at);
  const restScore = Math.min(restA, restB);
  const balanceScore = Math.max(0, 10 - recordDiff);
  const score = balanceScore * 2 + Math.min(restScore, 90) / 10;
  const reason =
    recordDiff <= 2
      ? "Similar experience"
      : restScore >= 30
        ? "Both well rested"
        : "Balanced pairing";

  return {
    fighterAId: a.id,
    fighterBId: b.id,
    score,
    reason,
  };
}

function selectRound1Pairings(
  fighters: FighterInput[],
  byeFighterId: string | null
): { pairings: PairingScore[]; byeId: string | null } {
  const active = fighters.filter((f) => f.id !== byeFighterId);
  const allPairs: PairingScore[] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      allPairs.push(scorePairing(active[i], active[j]));
    }
  }
  allPairs.sort((a, b) => b.score - a.score);

  const used = new Set<string>();
  const pairings: PairingScore[] = [];

  for (const pair of allPairs) {
    if (used.has(pair.fighterAId) || used.has(pair.fighterBId)) continue;
    pairings.push(pair);
    used.add(pair.fighterAId);
    used.add(pair.fighterBId);
  }

  let byeId = byeFighterId;
  if (!byeId) {
    const unused = fighters.find((f) => !used.has(f.id));
    byeId = unused?.id ?? null;
  }

  return { pairings, byeId };
}

function suggestByeFighter(fighters: FighterInput[]): string | null {
  if (fighters.length % 2 === 0) return null;
  const sorted = [...fighters].sort(
    (a, b) => daysSince(a.last_bout_at) - daysSince(b.last_bout_at)
  );
  return sorted[0]?.id ?? null;
}

export function generateProgressiveKnockoutBracket(
  fighters: FighterInput[],
  byeFighterId?: string | null
): { bouts: BracketPreviewBout[]; byeFighterId: string | null } {
  const n = fighters.length;
  if (n < 2) throw new Error("At least 2 fighters required");

  const byeId =
    byeFighterId ?? (n % 2 === 1 ? suggestByeFighter(fighters) : null);
  const { pairings } = selectRound1Pairings(fighters, byeId);

  const bouts: BracketPreviewBout[] = [];
  let boutOrder = 1;

  const round1Orders: number[] = [];
  for (const pair of pairings) {
    const order = boutOrder++;
    round1Orders.push(order);
    bouts.push({
      round_number: 1,
      bout_order: order,
      fighter_a_id: pair.fighterAId,
      fighter_b_id: pair.fighterBId,
      slot_a_type: "fighter",
      slot_b_type: "fighter",
      source_bout_a_order: null,
      source_bout_b_order: null,
      winner_advances_to_order: null,
      label: `Bout ${order}`,
    });
  }

  let currentRoundOrders = [...round1Orders];
  let roundNumber = 2;
  const byeEntersOrder = round1Orders[round1Orders.length - 1] ?? null;

  while (currentRoundOrders.length > 1) {
    const nextRoundOrders: number[] = [];

    for (let i = 0; i < currentRoundOrders.length; i += 2) {
      const orderA = currentRoundOrders[i];
      const orderB = currentRoundOrders[i + 1];
      const order = boutOrder++;
      nextRoundOrders.push(order);

      const isByeSlot =
        roundNumber === 2 &&
        byeId &&
        orderB === undefined &&
        orderA === byeEntersOrder;

      if (orderB !== undefined) {
        bouts.push({
          round_number: roundNumber,
          bout_order: order,
          fighter_a_id: null,
          fighter_b_id: null,
          slot_a_type: "winner_of",
          slot_b_type: "winner_of",
          source_bout_a_order: orderA,
          source_bout_b_order: orderB,
          winner_advances_to_order: null,
          label:
            roundNumber === Math.ceil(Math.log2(n)) + (n % 2 === 1 ? 1 : 0)
              ? "FINAL"
              : `Bout ${order}`,
        });

        const boutA = bouts.find((b) => b.bout_order === orderA);
        const boutB = bouts.find((b) => b.bout_order === orderB);
        if (boutA) boutA.winner_advances_to_order = order;
        if (boutB) boutB.winner_advances_to_order = order;
      } else if (isByeSlot || (roundNumber === 2 && byeId && i === currentRoundOrders.length - 1)) {
        bouts.push({
          round_number: roundNumber,
          bout_order: order,
          fighter_a_id: null,
          fighter_b_id: byeId,
          slot_a_type: "winner_of",
          slot_b_type: "bye",
          source_bout_a_order: orderA,
          source_bout_b_order: null,
          winner_advances_to_order: null,
          label: `Bout ${order}`,
        });
        const boutA = bouts.find((b) => b.bout_order === orderA);
        if (boutA) boutA.winner_advances_to_order = order;
      }
    }

    if (roundNumber === 2 && byeId && byeEntersOrder) {
      const byeBoutExists = bouts.some(
        (b) => b.round_number === 2 && b.slot_b_type === "bye"
      );
      if (!byeBoutExists) {
        const order = boutOrder++;
        nextRoundOrders.push(order);
        bouts.push({
          round_number: 2,
          bout_order: order,
          fighter_a_id: null,
          fighter_b_id: byeId,
          slot_a_type: "winner_of",
          slot_b_type: "bye",
          source_bout_a_order: byeEntersOrder,
          source_bout_b_order: null,
          winner_advances_to_order: null,
          label: `Bout ${order}`,
        });
        const boutA = bouts.find((b) => b.bout_order === byeEntersOrder);
        if (boutA) boutA.winner_advances_to_order = order;
      }
    }

    currentRoundOrders = nextRoundOrders;
    roundNumber++;
  }

  return { bouts, byeFighterId: byeId };
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
        ? Boolean(preview.fighter_b_id)
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
