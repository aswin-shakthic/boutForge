import { describe, expect, it } from "vitest";
import {
  buildFirstRoundSlots,
  countBracketByes,
  generateBracketBouts,
  nextPowerOfTwo,
  resolveInitialBoutStatus,
} from "./bracket-engine";
import type { BracketPreviewBout, FighterInput } from "./types";

function fighters(count: number): FighterInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `f${i + 1}`,
    first_name: "Test",
    last_name: `Fighter${i + 1}`,
    dob: "2010-01-01",
    gender: "male" as const,
    weight_kg: 50 + i,
    wins: 0,
    losses: 0,
    draws: 0,
    last_bout_at: null,
  }));
}

describe("nextPowerOfTwo", () => {
  it("uses 2,4,8,16,... bracket sizes", () => {
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe("countBracketByes", () => {
  it("returns bracket size minus fighter count", () => {
    expect(countBracketByes(5)).toBe(3);
    expect(countBracketByes(9)).toBe(7);
    expect(countBracketByes(4)).toBe(0);
  });
});

describe("buildFirstRoundSlots", () => {
  it("opens with one qualification bout for five fighters", () => {
    const slots = buildFirstRoundSlots(fighters(5));

    expect(slots).toEqual([{ type: "fight", fighterAId: "f1", fighterBId: "f2" }]);
  });

  it("opens with one qualification bout for nine fighters", () => {
    const slots = buildFirstRoundSlots(fighters(9));

    expect(slots).toEqual([{ type: "fight", fighterAId: "f1", fighterBId: "f2" }]);
  });
});

describe("generateBracketBouts", () => {
  it("builds fight-1 style bracket for five fighters", () => {
    const { bouts, byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      fighters(5)
    );

    expect(byeFighterId).toBe("f3");
    expect(bouts).toHaveLength(4);
    expect(bouts.filter((b) => b.round_number === 1)).toHaveLength(1);
    expect(bouts.some((b) => b.fighter_a_id === "f1" && b.fighter_b_id === "f2")).toBe(true);
    expect(bouts.some((b) => b.fighter_a_id === "f4" && b.fighter_b_id === "f5")).toBe(true);
    expect(
      bouts.some(
        (b) =>
          b.source_bout_a_order === 1 &&
          b.fighter_b_id === "f3" &&
          b.slot_a_type === "winner_of"
      )
    ).toBe(true);
    expect(bouts.some((b) => b.label === "FINAL")).toBe(true);
  });

  it("routes the game 1 winner through the bye fighter into the final", () => {
    const { bouts } = generateBracketBouts("progressive_knockout", fighters(5));
    const game1 = bouts.find((b) => b.fighter_a_id === "f1" && b.fighter_b_id === "f2");
    const game2 = bouts.find((b) => b.fighter_a_id === "f4" && b.fighter_b_id === "f5");
    const semi = bouts.find(
      (b) => b.source_bout_a_order === game1?.bout_order && b.fighter_b_id === "f3"
    );
    const final = bouts.find(
      (b) =>
        b.source_bout_a_order === game2?.bout_order &&
        b.source_bout_b_order === semi?.bout_order
    );

    expect(semi).toBeDefined();
    expect(final).toBeDefined();
  });

  it("builds fight-2 style bracket for six fighters", () => {
    const { bouts } = generateBracketBouts("progressive_knockout", fighters(6));

    expect(bouts).toHaveLength(5);
    expect(bouts.filter((b) => b.round_number === 1)).toHaveLength(2);
    expect(bouts.some((b) => b.fighter_a_id === "f1" && b.fighter_b_id === "f2")).toBe(true);
    expect(bouts.some((b) => b.fighter_a_id === "f3" && b.fighter_b_id === "f4")).toBe(true);
    expect(
      bouts.some(
        (b) => b.source_bout_a_order === 1 && b.fighter_b_id === "f5" && b.slot_a_type === "winner_of"
      )
    ).toBe(true);
    expect(
      bouts.some(
        (b) => b.source_bout_a_order === 2 && b.fighter_b_id === "f6" && b.slot_a_type === "winner_of"
      )
    ).toBe(true);
    expect(bouts.some((b) => b.label === "FINAL")).toBe(true);
  });

  it("builds a quarter-final stage for nine fighters", () => {
    const { bouts } = generateBracketBouts("progressive_knockout", fighters(9));

    expect(bouts.filter((b) => b.round_number === 1)).toHaveLength(1);
    expect(bouts.filter((b) => b.round_number === 2)).toHaveLength(4);
    expect(bouts.some((b) => b.label === "FINAL")).toBe(true);
  });

  it("builds progressive knockout bouts for even fighter counts", () => {
    const { bouts, byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      fighters(4)
    );

    expect(byeFighterId).toBeNull();
    expect(bouts.filter((b) => b.round_number === 1)).toHaveLength(2);
    expect(bouts.some((b) => b.slot_a_type === "fighter" && b.slot_b_type === "fighter")).toBe(
      true
    );
  });

  it("respects an explicit bye fighter", () => {
    const list = fighters(5);
    const { byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      list,
      "f5"
    );

    expect(byeFighterId).toBe("f5");
  });

  it("returns round-robin pairings", () => {
    const { bouts, byeFighterId } = generateBracketBouts("round_robin", fighters(4));

    expect(byeFighterId).toBeNull();
    expect(bouts.length).toBe(6);
  });

  it("returns no bouts for manual format", () => {
    const { bouts } = generateBracketBouts("manual", fighters(4));
    expect(bouts).toEqual([]);
  });
});

describe("resolveInitialBoutStatus", () => {
  it("marks round-one pairings as scheduled", () => {
    const preview: BracketPreviewBout = {
      round_number: 1,
      bout_order: 1,
      fighter_a_id: "f1",
      fighter_b_id: "f2",
      slot_a_type: "fighter",
      slot_b_type: "fighter",
      source_bout_a_order: null,
      source_bout_b_order: null,
      winner_advances_to_order: 3,
      label: "Game 1",
    };

    expect(resolveInitialBoutStatus(preview)).toBe("scheduled");
  });

  it("marks winner-vs-bye slots as pending until the source bout completes", () => {
    const preview: BracketPreviewBout = {
      round_number: 2,
      bout_order: 3,
      fighter_a_id: null,
      fighter_b_id: "f3",
      slot_a_type: "winner_of",
      slot_b_type: "fighter",
      source_bout_a_order: 1,
      source_bout_b_order: null,
      winner_advances_to_order: null,
      label: "Game 3",
    };

    expect(resolveInitialBoutStatus(preview)).toBe("pending_fighters");
  });

  it("marks winner-of slots as pending fighters", () => {
    const preview: BracketPreviewBout = {
      round_number: 2,
      bout_order: 3,
      fighter_a_id: null,
      fighter_b_id: null,
      slot_a_type: "winner_of",
      slot_b_type: "winner_of",
      source_bout_a_order: 1,
      source_bout_b_order: 2,
      winner_advances_to_order: null,
      label: "Final",
    };

    expect(resolveInitialBoutStatus(preview)).toBe("pending_fighters");
  });
});
