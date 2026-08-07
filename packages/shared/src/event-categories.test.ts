import { describe, expect, it } from "vitest";
import {
  buildDefaultEventCategoryConfig,
  ensureCompleteEventCategoryConfig,
} from "./event-categories";
import {
  AGE_CATEGORY_TEMPLATES,
  resolveTemplateBirthYears,
  weightSeedsForAgeCode,
} from "./constants";

describe("Cub categories", () => {
  it("resolves Cub 1–4 birth years for 2026 competition year", () => {
    const expected = [
      { code: "cub_1", from: 2020, to: 2021 },
      { code: "cub_2", from: 2018, to: 2019 },
      { code: "cub_3", from: 2016, to: 2017 },
      { code: "cub_4", from: 2014, to: 2015 },
    ];

    for (const entry of expected) {
      const template = AGE_CATEGORY_TEMPLATES.find((t) => t.code === entry.code);
      expect(template).toBeDefined();
      expect(resolveTemplateBirthYears(template!, 2026)).toEqual({
        birth_year_from: entry.from,
        birth_year_to: entry.to,
      });
    }
  });

  it("seeds 16–60+ kg classes in 2 kg steps for each cub category", () => {
    for (const code of ["cub_1", "cub_2", "cub_3", "cub_4"]) {
      const seeds = weightSeedsForAgeCode(code);
      expect(seeds).toHaveLength(46);
      expect(seeds.filter((s) => s.gender === "male")).toHaveLength(23);
      expect(seeds[0]).toMatchObject({ name: "16-18 kg", min_weight_kg: 16, max_weight_kg: 18 });
      expect(seeds[seeds.length - 1]).toMatchObject({
        name: "+60 kg",
        min_weight_kg: 60,
        max_weight_kg: null,
      });
    }
  });
});

describe("ensureCompleteEventCategoryConfig", () => {
  it("adds Junior when legacy saved config only has three categories", () => {
    const legacy = {
      competition_year: 2026,
      categories: [
        {
          id: "1",
          code: "sub_junior",
          name: "Sub-Junior",
          birth_year_from: 2012,
          birth_year_to: 2013,
          enabled: true,
          platform_id: "1",
          isDefault: true,
        },
        {
          id: "2",
          code: "youth",
          name: "Youth",
          birth_year_from: 2008,
          birth_year_to: 2009,
          enabled: true,
          platform_id: "2",
          isDefault: true,
        },
        {
          id: "3",
          code: "elite",
          name: "Elite",
          birth_year_from: 1900,
          birth_year_to: 2007,
          enabled: true,
          platform_id: "3",
          isDefault: true,
        },
      ],
      weight_classes: [],
    };

    const merged = ensureCompleteEventCategoryConfig(legacy);
    const codes = merged.categories.map((c) => c.code);

    expect(codes).toEqual([
      "cub_1",
      "cub_2",
      "cub_3",
      "cub_4",
      "sub_junior",
      "junior",
      "youth",
      "elite",
    ]);
    expect(merged.categories.find((c) => c.code === "junior")).toMatchObject({
      name: "Junior",
      birth_year_from: 2010,
      birth_year_to: 2011,
    });
  });

  it("buildDefaultEventCategoryConfig includes all eight templates", () => {
    const config = buildDefaultEventCategoryConfig(2026);
    expect(config.categories.map((c) => c.code)).toEqual([
      "cub_1",
      "cub_2",
      "cub_3",
      "cub_4",
      "sub_junior",
      "junior",
      "youth",
      "elite",
    ]);
    expect(config.categories.find((c) => c.code === "cub_1")).toMatchObject({
      name: "Cub 1",
      birth_year_from: 2020,
      birth_year_to: 2021,
    });
  });
});
