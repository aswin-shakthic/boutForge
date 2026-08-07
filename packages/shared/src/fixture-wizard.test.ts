import { describe, expect, it } from "vitest";
import {
  fighterMatchesBirthYearCategory,
  fighterMatchesWeightClass,
  fixtureSectionKey,
  resolveCategoryBirthYears,
} from "./constants";
import {
  categoriesAndWeightClassesForSections,
  eligibleFightersForSection,
  getAssignedElsewhere,
  getReadyFixtureSections,
  parseWeightInput,
  pruneFixtureWizardState,
  toggleSectionFighterSelection,
  type FixtureSectionLike,
} from "./fixture-wizard";
import type { Fighter } from "./types";

function fighter(
  overrides: Partial<Fighter> & Pick<Fighter, "id">
): Pick<Fighter, "id" | "dob" | "gender" | "weight_kg"> {
  return {
    id: overrides.id,
    dob: overrides.dob ?? "2010-06-01",
    gender: overrides.gender ?? "male",
    weight_kg: overrides.weight_kg ?? 50,
  };
}

function section(
  categoryId: string,
  weightClassId: string,
  overrides?: Partial<FixtureSectionLike>
): FixtureSectionLike {
  return {
    key: fixtureSectionKey(categoryId, weightClassId),
    category: {
      birth_year_from: 2010,
      birth_year_to: 2012,
      ...overrides?.category,
    },
    weightClass: {
      gender: "male",
      min_weight_kg: "48",
      max_weight_kg: "52",
      ...overrides?.weightClass,
    },
  };
}

describe("parseWeightInput", () => {
  it("parses valid decimal weights", () => {
    expect(parseWeightInput("52")).toBe(52);
    expect(parseWeightInput("51.5")).toBe(51.5);
  });

  it("returns null for empty or invalid input", () => {
    expect(parseWeightInput("")).toBeNull();
    expect(parseWeightInput("abc")).toBeNull();
  });
});

describe("fighterMatchesBirthYearCategory", () => {
  it("matches birth years inside inclusive range", () => {
    expect(fighterMatchesBirthYearCategory("2010-01-01", 2010, 2012)).toBe(true);
    expect(fighterMatchesBirthYearCategory("2012-12-31", 2010, 2012)).toBe(true);
  });

  it("rejects birth years outside range", () => {
    expect(fighterMatchesBirthYearCategory("2009-01-01", 2010, 2012)).toBe(false);
    expect(fighterMatchesBirthYearCategory("2013-01-01", 2010, 2012)).toBe(false);
  });

  it("handles reversed from/to values", () => {
    expect(fighterMatchesBirthYearCategory("2011-01-01", 2012, 2010)).toBe(true);
  });
});

describe("fighterMatchesWeightClass", () => {
  it("requires matching gender", () => {
    expect(
      fighterMatchesWeightClass(fighter({ id: "f1", gender: "female" }), {
        gender: "male",
        min_weight_kg: null,
        max_weight_kg: null,
      })
    ).toBe(false);
  });

  it("enforces min inclusive and max exclusive weight bounds", () => {
    const wc = { gender: "male" as const, min_weight_kg: 48, max_weight_kg: 52 };
    expect(fighterMatchesWeightClass(fighter({ id: "f1", weight_kg: 50 }), wc)).toBe(true);
    expect(fighterMatchesWeightClass(fighter({ id: "f2", weight_kg: 47.9 }), wc)).toBe(false);
    expect(fighterMatchesWeightClass(fighter({ id: "f3", weight_kg: 52 }), wc)).toBe(false);
    expect(fighterMatchesWeightClass(fighter({ id: "f4", weight_kg: 51.9 }), wc)).toBe(true);
  });
});

describe("resolveCategoryBirthYears", () => {
  it("uses stored birth years when present", () => {
    expect(
      resolveCategoryBirthYears(
        { min_age: 10, max_age: 12, birth_year_from: 2014, birth_year_to: 2012 },
        2026
      )
    ).toEqual({ birth_year_from: 2012, birth_year_to: 2014 });
  });

  it("derives birth years from platform template code and competition year", () => {
    expect(
      resolveCategoryBirthYears(
        {
          code: "sub_junior",
          min_age: 13,
          max_age: 14,
          birth_year_from: null,
          birth_year_to: null,
          is_custom: false,
        },
        2026
      )
    ).toEqual({ birth_year_from: 2012, birth_year_to: 2013 });
  });

  it("derives birth years from age range when no template applies", () => {
    expect(
      resolveCategoryBirthYears(
        { min_age: 13, max_age: 15, birth_year_from: null, birth_year_to: null },
        2026
      )
    ).toEqual({ birth_year_from: 2011, birth_year_to: 2013 });
  });
});

describe("getAssignedElsewhere", () => {
  it("collects fighter ids from all other sections", () => {
    const selected = {
      "cat-a:wc-1": ["f1", "f2"],
      "cat-a:wc-2": ["f3"],
      "cat-b:wc-1": ["f4"],
    };

    expect(getAssignedElsewhere("cat-a:wc-1", selected)).toEqual(new Set(["f3", "f4"]));
    expect(getAssignedElsewhere("cat-a:wc-2", selected)).toEqual(new Set(["f1", "f2", "f4"]));
  });
});

describe("eligibleFightersForSection", () => {
  const fighters = [
    fighter({ id: "youth-50", dob: "2011-01-01", weight_kg: 50 }),
    fighter({ id: "youth-55", dob: "2011-05-01", weight_kg: 55 }),
    fighter({ id: "elite-50", dob: "2005-01-01", weight_kg: 50 }),
    fighter({ id: "female-50", dob: "2011-01-01", gender: "female", weight_kg: 50 }),
  ];

  const youth52 = section("youth", "52kg");
  const youth57 = section("youth", "57kg", {
    weightClass: { gender: "male", min_weight_kg: "54", max_weight_kg: "57" },
  });

  it("filters by birth year, gender, and weight for each section", () => {
    expect(eligibleFightersForSection(youth52, fighters, {}).map((f) => f.id)).toEqual([
      "youth-50",
    ]);
    expect(eligibleFightersForSection(youth57, fighters, {}).map((f) => f.id)).toEqual([
      "youth-55",
    ]);
  });

  it("hides fighters already assigned to another section", () => {
    const selected = { [youth52.key]: ["youth-50"] };

    expect(eligibleFightersForSection(youth57, fighters, selected).map((f) => f.id)).toEqual([
      "youth-55",
    ]);
    expect(eligibleFightersForSection(youth52, fighters, selected).map((f) => f.id)).toEqual([
      "youth-50",
    ]);
  });

  it("keeps already-selected fighters visible in their section", () => {
    const selected = { [youth52.key]: ["youth-55"] };

    expect(eligibleFightersForSection(youth52, fighters, selected).map((f) => f.id)).toContain(
      "youth-55"
    );
  });
});

describe("toggleSectionFighterSelection", () => {
  it("adds a fighter to the target section", () => {
    expect(toggleSectionFighterSelection("f1", "sec-a", {})).toEqual({ "sec-a": ["f1"] });
  });

  it("removes a fighter when toggled off", () => {
    expect(toggleSectionFighterSelection("f1", "sec-a", { "sec-a": ["f1"] })).toEqual({
      "sec-a": [],
    });
  });

  it("moves a fighter exclusively to the new section", () => {
    const result = toggleSectionFighterSelection("f1", "sec-b", {
      "sec-a": ["f1", "f2"],
      "sec-b": ["f3"],
    });

    expect(result).toEqual({
      "sec-a": ["f2"],
      "sec-b": ["f3", "f1"],
    });
  });
});

describe("getReadyFixtureSections", () => {
  const sections = [
    { key: "a:1" },
    { key: "a:2" },
    { key: "b:1" },
  ];

  it("returns only sections with at least two fighters", () => {
    const selected = {
      "a:1": ["f1", "f2"],
      "a:2": ["f3"],
      "b:1": ["f4", "f5", "f6"],
    };

    expect(getReadyFixtureSections(sections, selected).map((s) => s.key)).toEqual(["a:1", "b:1"]);
  });
});

describe("multi-section fixture flow", () => {
  it("supports assigning different fighters per section and producing multiple ready brackets", () => {
    const fighters = [
      fighter({ id: "sj-48", dob: "2012-01-01", weight_kg: 48 }),
      fighter({ id: "sj-52", dob: "2012-06-01", weight_kg: 52 }),
      fighter({ id: "youth-57", dob: "2010-01-01", weight_kg: 57 }),
      fighter({ id: "youth-60", dob: "2010-08-01", weight_kg: 60 }),
    ];

    const subJunior48 = section("sub-junior", "48", {
      category: { birth_year_from: 2012, birth_year_to: 2014 },
      weightClass: { gender: "male", min_weight_kg: "46", max_weight_kg: "48" },
    });
    const youth57 = section("youth", "57", {
      category: { birth_year_from: 2008, birth_year_to: 2010 },
      weightClass: { gender: "male", min_weight_kg: "54", max_weight_kg: "57" },
    });

    const sections = [subJunior48, youth57];
    let selected: Record<string, string[]> = {};

    for (const id of ["sj-48", "sj-52"]) {
      selected = toggleSectionFighterSelection(id, subJunior48.key, selected);
    }
    for (const id of ["youth-57", "youth-60"]) {
      selected = toggleSectionFighterSelection(id, youth57.key, selected);
    }

    expect(getReadyFixtureSections(sections, selected)).toHaveLength(2);
    expect(selected[subJunior48.key]).toEqual(["sj-48", "sj-52"]);
    expect(selected[youth57.key]).toEqual(["youth-57", "youth-60"]);

    expect(eligibleFightersForSection(subJunior48, fighters, selected).map((f) => f.id)).toEqual([
      "sj-48",
      "sj-52",
    ]);
    expect(eligibleFightersForSection(youth57, fighters, selected).map((f) => f.id)).toEqual([
      "youth-57",
      "youth-60",
    ]);
  });
});

describe("pruneFixtureWizardState", () => {
  it("drops selections and config for removed sections", () => {
    const valid = new Set(["keep:wc"]);
    const result = pruneFixtureWizardState(
      { "keep:wc": ["f1"], "gone:wc": ["f2"] },
      { "keep:wc": { format: "manual" }, "gone:wc": { format: "round_robin" } },
      valid
    );

    expect(result.selectedBySection).toEqual({ "keep:wc": ["f1"] });
    expect(result.configBySection).toEqual({ "keep:wc": { format: "manual" } });
  });
});

describe("categoriesAndWeightClassesForSections", () => {
  it("collects unique category and weight class ids from ready sections", () => {
    const ready = [
      {
        category: { id: "cat-a" },
        weightClass: { id: "wc-1" },
      },
      {
        category: { id: "cat-a" },
        weightClass: { id: "wc-2" },
      },
      {
        category: { id: "cat-b" },
        weightClass: { id: "wc-3" },
      },
    ];

    const { categoryIds, weightClassIds } = categoriesAndWeightClassesForSections(ready);

    expect(categoryIds).toEqual(new Set(["cat-a", "cat-b"]));
    expect(weightClassIds).toEqual(new Set(["wc-1", "wc-2", "wc-3"]));
  });
});
