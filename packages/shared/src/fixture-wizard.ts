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

export function setSectionFighterSelection(
  sectionKey: string,
  fighterIds: string[],
  selectedBySection: Record<string, string[]>
): Record<string, string[]> {
  return {
    ...selectedBySection,
    [sectionKey]: fighterIds,
  };
}

export function addFightersToSectionSelection(
  sectionKey: string,
  fighterIds: string[],
  selectedBySection: Record<string, string[]>
): Record<string, string[]> {
  const toAdd = new Set(fighterIds);
  const next: Record<string, string[]> = {};

  for (const [key, ids] of Object.entries(selectedBySection)) {
    if (key === sectionKey) continue;
    next[key] = ids.filter((id) => !toAdd.has(id));
  }

  const current = new Set(next[sectionKey] ?? selectedBySection[sectionKey] ?? []);
  for (const id of fighterIds) current.add(id);
  next[sectionKey] = Array.from(current);

  return next;
}

export function clearSectionFighterSelection(
  sectionKey: string,
  selectedBySection: Record<string, string[]>
): Record<string, string[]> {
  return setSectionFighterSelection(sectionKey, [], selectedBySection);
}

export type FighterAssignmentFilters = {
  clubId: string;
  categoryDraftId: string;
  gender: Gender | "all";
  search: string;
};

export type FighterAssignmentCategory = {
  id: string;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
};

export function getFighterEventCategoryName(
  dob: string,
  categories: Array<Pick<FighterAssignmentCategory, "name" | "birth_year_from" | "birth_year_to">>
): string | null {
  for (const category of categories) {
    if (
      fighterMatchesBirthYearCategory(
        dob,
        category.birth_year_from,
        category.birth_year_to
      )
    ) {
      return category.name;
    }
  }
  return null;
}

export function filterFightersForAssignment<
  T extends Pick<Fighter, "id" | "dob" | "gender" | "first_name" | "last_name"> & {
    club_id?: string;
    affiliation_name?: string | null;
    club?: { name?: string | null } | null;
  },
>(
  fighters: T[],
  filters: FighterAssignmentFilters,
  categories: FighterAssignmentCategory[]
): T[] {
  const search = filters.search.trim().toLowerCase();
  const categoryFilter = categories.find((c) => c.id === filters.categoryDraftId);

  return fighters.filter((fighter) => {
    if (filters.clubId !== "all" && fighter.club_id !== filters.clubId) {
      return false;
    }
    if (filters.gender !== "all" && fighter.gender !== filters.gender) {
      return false;
    }
    if (categoryFilter) {
      if (
        !fighterMatchesBirthYearCategory(
          fighter.dob,
          categoryFilter.birth_year_from,
          categoryFilter.birth_year_to
        )
      ) {
        return false;
      }
    }
    if (search) {
      const fullName = `${fighter.first_name} ${fighter.last_name}`.toLowerCase();
      const clubName = (fighter.club?.name ?? fighter.affiliation_name ?? "").toLowerCase();
      if (!fullName.includes(search) && !clubName.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

export function groupFightersByClub<
  T extends Pick<Fighter, "club_id" | "last_name" | "first_name"> & {
    club?: { name?: string | null } | null;
    affiliation_name?: string | null;
  },
>(fighters: T[]): Array<{ clubId: string; clubName: string; fighters: T[] }> {
  const groups = new Map<string, { clubName: string; fighters: T[] }>();

  for (const fighter of fighters) {
    const clubId = fighter.club_id;
    const clubName =
      fighter.club?.name?.trim() || fighter.affiliation_name?.trim() || "Unknown club";
    const existing = groups.get(clubId);
    if (existing) {
      existing.fighters.push(fighter);
    } else {
      groups.set(clubId, { clubName, fighters: [fighter] });
    }
  }

  return Array.from(groups.entries())
    .map(([clubId, group]) => ({
      clubId,
      clubName: group.clubName,
      fighters: group.fighters.sort(
        (a, b) =>
          a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
      ),
    }))
    .sort((a, b) => a.clubName.localeCompare(b.clubName));
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
