import { describe, expect, it } from "vitest";
import {
  getBracketMatchMarginTop,
  getMatchGameLabel,
  getRoundShortLabel,
  groupBracketsByEvent,
  groupBracketsForDisplay,
  organizeBoutsByRound,
} from "./bracket-layout";

describe("getRoundShortLabel", () => {
  it("labels final rounds with standard abbreviations", () => {
    expect(getRoundShortLabel(4, 4, 1)).toBe("F");
    expect(getRoundShortLabel(3, 4, 2)).toBe("SF");
    expect(getRoundShortLabel(2, 4, 4)).toBe("QF");
    expect(getRoundShortLabel(1, 4, 8)).toBe("R16");
  });
});

describe("organizeBoutsByRound", () => {
  it("groups bouts into ordered round columns", () => {
    const bouts = [
      { id: "1", round_number: 1, bout_order: 2 },
      { id: "2", round_number: 1, bout_order: 1 },
      { id: "3", round_number: 2, bout_order: 3 },
    ];

    const { maxRound, rounds } = organizeBoutsByRound(bouts);

    expect(maxRound).toBe(2);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].label).toBe("R1");
    expect(rounds[0].bouts.map((b) => b.id)).toEqual(["2", "1"]);
    expect(rounds[1].label).toBe("F");
    expect(rounds[1].bouts.map((b) => b.id)).toEqual(["3"]);
  });
});

describe("getMatchGameLabel", () => {
  it("formats round label with global bout order", () => {
    expect(getMatchGameLabel("SF", 3)).toBe("SF · Game 3");
    expect(getMatchGameLabel("QF", 5)).toBe("QF · Game 5");
  });
});

describe("getBracketMatchMarginTop", () => {
  it("centers later-round matches between earlier-round pairs", () => {
    expect(getBracketMatchMarginTop(1, 0)).toBe(0);
    expect(getBracketMatchMarginTop(1, 1)).toBe(52);
    expect(getBracketMatchMarginTop(2, 0)).toBe(26);
  });
});

describe("groupBracketsForDisplay", () => {
  it("groups brackets by category, gender, and weight class", () => {
    const groups = groupBracketsForDisplay([
      {
        id: "a",
        name: "Youth 52",
        format: "progressive_knockout",
        status: "published",
        scheduled_date: null,
        created_at: "2026-01-01",
        event_id: "event-1",
        gender: "male",
        age_category_id: "1",
        weight_class_id: "1",
        age_category: { name: "Youth" },
        weight_class: { name: "52 kg", gender: "male" },
      },
      {
        id: "b",
        name: "Youth 57",
        format: "progressive_knockout",
        status: "published",
        scheduled_date: null,
        created_at: "2026-01-01",
        event_id: "event-1",
        gender: "male",
        age_category_id: "1",
        weight_class_id: "2",
        age_category: { name: "Youth" },
        weight_class: { name: "57 kg", gender: "male" },
      },
      {
        id: "c",
        name: "Elite 60",
        format: "progressive_knockout",
        status: "published",
        scheduled_date: null,
        created_at: "2026-01-01",
        event_id: "event-1",
        gender: "male",
        age_category_id: "2",
        weight_class_id: "3",
        age_category: { name: "Elite" },
        weight_class: { name: "60 kg", gender: "male" },
      },
    ]);

    expect(groups).toHaveLength(3);
    expect(groups[0].title).toBe("Elite");
    expect(groups[1].title).toBe("Youth");
    expect(groups[1].brackets).toHaveLength(1);
  });
});

describe("groupBracketsByEvent", () => {
  it("groups brackets by event with nested category sections", () => {
    const groups = groupBracketsByEvent([
      {
        id: "a",
        name: "Youth 52",
        format: "progressive_knockout",
        status: "published",
        scheduled_date: null,
        created_at: "2026-01-01",
        event_id: "event-a",
        gender: "male",
        age_category_id: "1",
        weight_class_id: "1",
        age_category: { name: "Youth" },
        weight_class: { name: "52 kg", gender: "male" },
        event: {
          id: "event-a",
          name: "Spring Open",
          date: "2026-03-01",
          status: "published",
        },
      },
      {
        id: "b",
        name: "Elite 60",
        format: "progressive_knockout",
        status: "published",
        scheduled_date: null,
        created_at: "2026-01-01",
        event_id: "event-b",
        gender: "male",
        age_category_id: "2",
        weight_class_id: "3",
        age_category: { name: "Elite" },
        weight_class: { name: "60 kg", gender: "male" },
        event: {
          id: "event-b",
          name: "Winter Classic",
          date: "2026-01-15",
          status: "draft",
        },
      },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].title).toBe("Spring Open");
    expect(groups[0].sections).toHaveLength(1);
    expect(groups[1].title).toBe("Winter Classic");
  });
});
