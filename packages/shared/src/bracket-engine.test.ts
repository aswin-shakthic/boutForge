import { describe, expect, it } from "vitest";
import { generateBracketBouts } from "./bracket-engine";
import type { FighterInput } from "./types";

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

describe("generateBracketBouts", () => {
  it("builds progressive knockout bouts for even fighter counts", () => {
    const { bouts, byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      fighters(4)
    );

    expect(byeFighterId).toBeNull();
    expect(bouts.length).toBeGreaterThan(0);
    expect(bouts.some((b) => b.slot_a_type === "fighter" && b.slot_b_type === "fighter")).toBe(
      true
    );
  });

  it("assigns a bye for odd fighter counts", () => {
    const { bouts, byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      fighters(3)
    );

    expect(byeFighterId).not.toBeNull();
    expect(bouts.length).toBeGreaterThan(0);
  });

  it("respects an explicit bye fighter", () => {
    const list = fighters(3);
    const { byeFighterId } = generateBracketBouts(
      "progressive_knockout",
      list,
      "f2"
    );

    expect(byeFighterId).toBe("f2");
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
