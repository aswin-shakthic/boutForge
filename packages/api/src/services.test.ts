import { describe, expect, it } from "vitest";
import { extractBracketFighterIds } from "./services";

describe("extractBracketFighterIds", () => {
  it("preserves first-seen fighter order across rounds", () => {
    const fighterIds = extractBracketFighterIds(
      [
        {
          round_number: 1,
          bout_order: 1,
          fighter_a_id: "f1",
          fighter_b_id: "f2",
          slot_a_type: "fighter",
          slot_b_type: "fighter",
        },
        {
          round_number: 1,
          bout_order: 2,
          fighter_a_id: "f3",
          fighter_b_id: "f4",
          slot_a_type: "fighter",
          slot_b_type: "fighter",
        },
        {
          round_number: 2,
          bout_order: 4,
          fighter_a_id: null,
          fighter_b_id: "f5",
          slot_a_type: "winner_of",
          slot_b_type: "fighter",
        },
      ],
      "f5"
    );

    expect(fighterIds).toEqual(["f1", "f2", "f3", "f4", "f5"]);
  });
});
