import { describe, expect, it } from "vitest";
import {
  buildDefaultEventCategoryConfig,
  ensureCompleteEventCategoryConfig,
} from "./event-categories";

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

    expect(codes).toEqual(["sub_junior", "junior", "youth", "elite"]);
    expect(merged.categories.find((c) => c.code === "junior")).toMatchObject({
      name: "Junior",
      birth_year_from: 2010,
      birth_year_to: 2011,
    });
  });

  it("buildDefaultEventCategoryConfig includes all four templates", () => {
    const config = buildDefaultEventCategoryConfig(2026);
    expect(config.categories.map((c) => c.code)).toEqual([
      "sub_junior",
      "junior",
      "youth",
      "elite",
    ]);
  });
});
