import {
  fighterMatchesBirthYearCategory,
  fighterMatchesWeightClass,
} from "./constants";
import type { Fighter, Gender } from "./types";

export type FixtureSectionLike = {
  key: string;
  category: {
    birth_year_from: number;
    birth_year_to: number;
  };
  weightClass: {
    gender: Gender;
    min_weight_kg: string;
    max_weight_kg: string;
  };
};

export function parseWeightInput(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function getAssignedElsewhere(
  sectionKey: string,
  selectedBySection: Record<string, string[]>
): Set<string> {
  const ids = new Set<string>();
  for (const [key, fighterIds] of Object.entries(selectedBySection)) {
    if (key === sectionKey) continue;
    fighterIds.forEach((id) => ids.add(id));
  }
  return ids;
}

export function eligibleFightersForSection<T extends Pick<Fighter, "id" | "dob" | "gender" | "weight_kg">>(
  section: FixtureSectionLike,
  fighters: T[],
  selectedBySection: Record<string, string[]>
): T[] {
  const min = parseWeightInput(section.weightClass.min_weight_kg);
  const max = parseWeightInput(section.weightClass.max_weight_kg);
  const elsewhere = getAssignedElsewhere(section.key, selectedBySection);
  const selectedHere = new Set(selectedBySection[section.key] ?? []);

  return fighters.filter(
    (f) =>
      !elsewhere.has(f.id) &&
      (selectedHere.has(f.id) ||
        (fighterMatchesBirthYearCategory(
          f.dob,
          section.category.birth_year_from,
          section.category.birth_year_to
        ) &&
          fighterMatchesWeightClass(f, {
            gender: section.weightClass.gender,
            min_weight_kg: min,
            max_weight_kg: max,
          })))
  );
}

export function toggleSectionFighterSelection(
  fighterId: string,
  sectionKey: string,
  selectedBySection: Record<string, string[]>
): Record<string, string[]> {
  const next: Record<string, string[]> = {};

  for (const [key, ids] of Object.entries(selectedBySection)) {
    if (key !== sectionKey) {
      next[key] = ids.filter((id) => id !== fighterId);
    }
  }

  const current = new Set(next[sectionKey] ?? selectedBySection[sectionKey] ?? []);
  if (current.has(fighterId)) current.delete(fighterId);
  else current.add(fighterId);
  next[sectionKey] = Array.from(current);

  return next;
}

export function getReadyFixtureSections<T extends { key: string }>(
  sections: T[],
  selectedBySection: Record<string, string[]>,
  minFighters = 2
): T[] {
  return sections.filter(
    (section) => (selectedBySection[section.key]?.length ?? 0) >= minFighters
  );
}

export function pruneFixtureWizardState(
  selectedBySection: Record<string, string[]>,
  configBySection: Record<string, unknown>,
  validSectionKeys: Set<string>
): {
  selectedBySection: Record<string, string[]>;
  configBySection: Record<string, unknown>;
} {
  const nextSelected: Record<string, string[]> = {};
  const nextConfig: Record<string, unknown> = {};

  for (const [key, ids] of Object.entries(selectedBySection)) {
    if (validSectionKeys.has(key)) nextSelected[key] = ids;
  }
  for (const [key, config] of Object.entries(configBySection)) {
    if (validSectionKeys.has(key)) nextConfig[key] = config;
  }

  return { selectedBySection: nextSelected, configBySection: nextConfig };
}

export function categoriesAndWeightClassesForSections<
  TSection extends {
    category: { id: string };
    weightClass: { id: string };
  },
>(sections: TSection[]): {
  categoryIds: Set<string>;
  weightClassIds: Set<string>;
} {
  const categoryIds = new Set<string>();
  const weightClassIds = new Set<string>();
  for (const section of sections) {
    categoryIds.add(section.category.id);
    weightClassIds.add(section.weightClass.id);
  }
  return { categoryIds, weightClassIds };
}
