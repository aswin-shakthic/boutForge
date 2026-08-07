import type { AgeCategory, Fighter, Gender, WeightClass } from "./types";

export const APP_NAME = "BoutForge";

export const COLORS = {
  navy: "#1B2A4A",
  red: "#C8102E",
  white: "#FFFFFF",
  grey100: "#F5F5F5",
  grey200: "#E5E5E5",
  grey600: "#666666",
  grey900: "#1A1A1A",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform Admin",
  matchmaker: "Matchmaker",
  club_admin: "Club Admin",
  coach: "Coach",
  viewer: "Viewer",
};

export const BOUT_METHOD_LABELS: Record<string, string> = {
  KO: "Knockout",
  TKO: "Technical KO",
  UD: "Unanimous Decision",
  SD: "Split Decision",
  MD: "Majority Decision",
  DQ: "Disqualification",
  RSC: "Referee Stops Contest",
  NC: "No Contest",
  DRAW: "Draw",
};

/** Baseline competition year for stored platform birth-year examples (2026 → Sub-Junior 2012–2013). */
export const BASELINE_COMPETITION_YEAR = 2026;

export interface AgeCategoryTemplate {
  name: string;
  code: string;
  /** birth_year_from = competitionYear + offset (null = open lower bound for Elite). */
  birthYearFromOffset: number | null;
  birthYearToOffset: number;
  min_age: number;
  max_age: number;
}

export const AGE_CATEGORY_TEMPLATES: AgeCategoryTemplate[] = [
  {
    name: "Sub-Junior",
    code: "sub_junior",
    birthYearFromOffset: -14,
    birthYearToOffset: -13,
    min_age: 13,
    max_age: 14,
  },
  {
    name: "Junior",
    code: "junior",
    birthYearFromOffset: -16,
    birthYearToOffset: -15,
    min_age: 15,
    max_age: 16,
  },
  {
    name: "Youth",
    code: "youth",
    birthYearFromOffset: -18,
    birthYearToOffset: -17,
    min_age: 17,
    max_age: 18,
  },
  {
    name: "Elite",
    code: "elite",
    birthYearFromOffset: null,
    birthYearToOffset: -19,
    min_age: 19,
    max_age: 40,
  },
];

export function resolveTemplateBirthYears(
  template: AgeCategoryTemplate,
  competitionYear: number
): { birth_year_from: number; birth_year_to: number } {
  const birth_year_to = competitionYear + template.birthYearToOffset;
  const birth_year_from =
    template.birthYearFromOffset === null
      ? 1900
      : competitionYear + template.birthYearFromOffset;
  return {
    birth_year_from: Math.min(birth_year_from, birth_year_to),
    birth_year_to: Math.max(birth_year_from, birth_year_to),
  };
}

export const DEFAULT_AGE_CATEGORIES: Omit<AgeCategory, "id" | "club_id">[] =
  AGE_CATEGORY_TEMPLATES.map((template) => {
    const years = resolveTemplateBirthYears(template, BASELINE_COMPETITION_YEAR);
    return {
      name: template.name,
      code: template.code,
      min_age: template.min_age,
      max_age: template.max_age,
      birth_year_from: years.birth_year_from,
      birth_year_to: years.birth_year_to,
      is_custom: false,
    };
  });

export interface WeightClassSeed {
  name: string;
  gender: Gender;
  age_code: string;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
}

type WeightRange = [label: string, min: number, max: number | null];

function seedBothGenders(ageCode: string, ranges: WeightRange[]): WeightClassSeed[] {
  const seeds: WeightClassSeed[] = [];
  for (const gender of ["male", "female"] as Gender[]) {
    for (const [label, min, max] of ranges) {
      seeds.push({
        name: label.endsWith("kg") ? label : `${label} kg`,
        gender,
        age_code: ageCode,
        min_weight_kg: min,
        max_weight_kg: max,
      });
    }
  }
  return seeds;
}

function seedGender(
  ageCode: string,
  gender: Gender,
  ranges: WeightRange[]
): WeightClassSeed[] {
  return ranges.map(([label, min, max]) => ({
    name: label.endsWith("kg") ? label : `${label} kg`,
    gender,
    age_code: ageCode,
    min_weight_kg: min,
    max_weight_kg: max,
  }));
}

const SUB_JUNIOR_RANGES: WeightRange[] = [
  ["30-33", 30, 33],
  ["33-35", 33, 35],
  ["35-37", 35, 37],
  ["37-40", 37, 40],
  ["40-43", 40, 43],
  ["43-46", 43, 46],
  ["46-49", 46, 49],
  ["49-52", 49, 52],
  ["52-55", 52, 55],
  ["55-58", 55, 58],
  ["58-61", 58, 61],
  ["61-64", 61, 64],
  ["64-67", 64, 67],
  ["67-70", 67, 70],
  ["+70", 70, null],
];

const JUNIOR_RANGES: WeightRange[] = [
  ["44-46", 44, 46],
  ["46-48", 46, 48],
  ["48-50", 48, 50],
  ["50-52", 50, 52],
  ["52-54", 52, 54],
  ["54-57", 54, 57],
  ["57-60", 57, 60],
  ["60-63", 60, 63],
  ["63-66", 63, 66],
  ["66-70", 66, 70],
  ["70-75", 70, 75],
  ["75-80", 75, 80],
  ["+80", 80, null],
];

const OPEN_MALE_RANGES: WeightRange[] = [
  ["47-50", 47, 50],
  ["50-55", 50, 55],
  ["55-60", 55, 60],
  ["60-65", 60, 65],
  ["65-70", 65, 70],
  ["70-75", 70, 75],
  ["75-80", 75, 80],
  ["80-85", 80, 85],
  ["85-90", 85, 90],
  ["+90", 90, null],
];

const OPEN_FEMALE_RANGES: WeightRange[] = [
  ["45-48", 45, 48],
  ["48-51", 48, 51],
  ["51-54", 51, 54],
  ["54-57", 54, 57],
  ["57-60", 57, 60],
  ["60-65", 60, 65],
  ["65-70", 65, 70],
  ["70-75", 70, 75],
  ["75-80", 75, 80],
  ["+80", 80, null],
];

export const BFI_WEIGHT_CLASSES: WeightClassSeed[] = [
  ...seedBothGenders("sub_junior", SUB_JUNIOR_RANGES),
  ...seedBothGenders("junior", JUNIOR_RANGES),
  ...seedGender("youth", "male", OPEN_MALE_RANGES),
  ...seedGender("youth", "female", OPEN_FEMALE_RANGES),
  ...seedGender("elite", "male", OPEN_MALE_RANGES),
  ...seedGender("elite", "female", OPEN_FEMALE_RANGES),
];

const WEIGHT_SEEDS_BY_AGE_CODE = BFI_WEIGHT_CLASSES.reduce<Map<string, WeightClassSeed[]>>(
  (map, seed) => {
    const list = map.get(seed.age_code);
    if (list) list.push(seed);
    else map.set(seed.age_code, [seed]);
    return map;
  },
  new Map()
);

export function weightSeedsForAgeCode(ageCode: string): readonly WeightClassSeed[] {
  return WEIGHT_SEEDS_BY_AGE_CODE.get(ageCode) ?? [];
}

export function getBirthYearFromDob(dob: string): number {
  return new Date(dob).getFullYear();
}

export function ageRangeFromBirthYears(
  birthYearFrom: number,
  birthYearTo: number,
  competitionYear?: number
): { min_age: number; max_age: number; birth_year_from: number; birth_year_to: number } {
  const year = competitionYear ?? new Date().getFullYear();
  const from = Math.min(birthYearFrom, birthYearTo);
  const to = Math.max(birthYearFrom, birthYearTo);
  return {
    birth_year_from: from,
    birth_year_to: to,
    min_age: year - to,
    max_age: year - from,
  };
}

export function birthYearsFromAgeRange(
  minAge: number,
  maxAge: number,
  competitionYear?: number
): { birth_year_from: number; birth_year_to: number } {
  const year = competitionYear ?? new Date().getFullYear();
  return {
    birth_year_from: year - maxAge,
    birth_year_to: year - minAge,
  };
}

export function resolveCategoryBirthYears(
  category: {
    code?: string;
    min_age: number;
    max_age: number;
    birth_year_from: number | null;
    birth_year_to: number | null;
    is_custom?: boolean;
  },
  competitionYear?: number
): { birth_year_from: number; birth_year_to: number } {
  const year = competitionYear ?? new Date().getFullYear();
  const template = category.code
    ? AGE_CATEGORY_TEMPLATES.find((entry) => entry.code === category.code)
    : undefined;

  if (template && !category.is_custom) {
    return resolveTemplateBirthYears(template, year);
  }

  if (category.birth_year_from != null && category.birth_year_to != null) {
    return {
      birth_year_from: Math.min(category.birth_year_from, category.birth_year_to),
      birth_year_to: Math.max(category.birth_year_from, category.birth_year_to),
    };
  }
  return birthYearsFromAgeRange(category.min_age, category.max_age, year);
}

export function fighterMatchesBirthYearCategory(
  dob: string,
  birthYearFrom: number,
  birthYearTo: number
): boolean {
  const birthYear = getBirthYearFromDob(dob);
  const from = Math.min(birthYearFrom, birthYearTo);
  const to = Math.max(birthYearFrom, birthYearTo);
  return birthYear >= from && birthYear <= to;
}

export function fighterMatchesWeightClass(
  fighter: { gender: Gender; weight_kg: number },
  weightClass: {
    gender: Gender;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  }
): boolean {
  if (fighter.gender !== weightClass.gender) return false;
  if (
    weightClass.min_weight_kg !== null &&
    fighter.weight_kg < weightClass.min_weight_kg
  ) {
    return false;
  }
  if (
    weightClass.max_weight_kg !== null &&
    fighter.weight_kg >= weightClass.max_weight_kg
  ) {
    return false;
  }
  return true;
}

function weightClassSpan(wc: {
  min_weight_kg: number | null;
  max_weight_kg: number | null;
}): number {
  const min = wc.min_weight_kg ?? 0;
  const max = wc.max_weight_kg ?? min + 1000;
  return max - min;
}

export function fixtureSectionKey(
  categoryId: string,
  weightClassId: string
): string {
  return `${categoryId}:${weightClassId}`;
}

export function getAgeFromDob(dob: string, competitionYear?: number): number {
  const year = competitionYear ?? new Date().getFullYear();
  const birthYear = new Date(dob).getFullYear();
  return year - birthYear;
}

export function parseBirthYear(value: string | number): number | null {
  const year =
    typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  if (!Number.isInteger(year)) return null;

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return null;

  return year;
}

export function dobFromBirthYear(birthYear: number): string {
  return `${birthYear}-01-01`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeClubLookupKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function compactClubLookupKey(name: string): string {
  return normalizeClubLookupKey(name).replace(/[^a-z0-9]/g, "");
}

export function getImportableClubLabel(entry: {
  club_id: string;
  club?: { name?: string | null } | null;
}): string {
  return entry.club?.name?.trim() || entry.club_id;
}

export function formatImportableClubNames(
  memberships: Array<{ club_id: string; club?: { name?: string | null } | null }>
): string {
  const names = memberships.map(getImportableClubLabel);
  if (names.length === 0) return "none";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

export function resolveImportableClub(
  memberships: Array<{ club_id: string; club?: { name?: string | null } | null }>,
  clubNameOrId: string
): (typeof memberships)[number] | null {
  const raw = clubNameOrId.trim();
  if (!raw) return null;

  if (UUID_PATTERN.test(raw)) {
    return memberships.find((entry) => entry.club_id === raw) ?? null;
  }

  const normalized = normalizeClubLookupKey(raw);
  const compact = compactClubLookupKey(raw);

  const exactMatches = memberships.filter(
    (entry) => normalizeClubLookupKey(getImportableClubLabel(entry)) === normalized
  );
  if (exactMatches.length === 1) return exactMatches[0];

  const compactMatches = memberships.filter(
    (entry) => compactClubLookupKey(getImportableClubLabel(entry)) === compact
  );
  if (compactMatches.length === 1) return compactMatches[0];

  const prefixMatches = memberships.filter((entry) => {
    const label = normalizeClubLookupKey(getImportableClubLabel(entry));
    return label.startsWith(normalized) || normalized.startsWith(label);
  });
  if (prefixMatches.length === 1) return prefixMatches[0];

  return null;
}

export function classifyAgeCategory(
  dob: string,
  ageCategories: AgeCategory[],
  competitionYear?: number
): AgeCategory | null {
  const byBirthYear = ageCategories
    .map((category) => ({
      category,
      years: resolveCategoryBirthYears(category, competitionYear),
    }))
    .filter(({ years }) =>
      fighterMatchesBirthYearCategory(
        dob,
        years.birth_year_from,
        years.birth_year_to
      )
    );

  if (byBirthYear.length > 0) {
    byBirthYear.sort(
      (a, b) =>
        a.years.birth_year_to -
        a.years.birth_year_from -
        (b.years.birth_year_to - b.years.birth_year_from)
    );
    return byBirthYear[0].category;
  }

  const age = getAgeFromDob(dob, competitionYear);
  return (
    ageCategories.find((c) => age >= c.min_age && age <= c.max_age) ?? null
  );
}

export function classifyWeightClass(
  weightKg: number,
  gender: Gender,
  ageCategoryId: string,
  weightClasses: WeightClass[]
): WeightClass | null {
  const eligible = weightClasses.filter(
    (wc) =>
      wc.gender === gender &&
      wc.age_category_id === ageCategoryId &&
      wc.is_enabled &&
      fighterMatchesWeightClass({ gender, weight_kg: weightKg }, wc)
  );

  if (eligible.length === 0) return null;

  eligible.sort((a, b) => weightClassSpan(a) - weightClassSpan(b));
  return eligible[0];
}

export function fighterFullName(f: { first_name: string; last_name: string }): string {
  return `${f.first_name} ${f.last_name}`;
}

export function getFighterClubDisplayName(f: {
  affiliation_name?: string | null;
  club?: { name?: string | null } | null;
}): string {
  const affiliation = f.affiliation_name?.trim();
  if (affiliation) return affiliation;
  return f.club?.name?.trim() || "—";
}

export function fighterRecord(f: { wins: number; losses: number; draws: number }): string {
  return `${f.wins}-${f.losses}-${f.draws}`;
}

export function participationRecord(summary: {
  wins: number;
  losses: number;
  draws: number;
  nc?: number;
}): string {
  const base = fighterRecord(summary);
  return summary.nc ? `${base} · ${summary.nc} NC` : base;
}

export function fighterSectionKey(f: {
  age_category_id: string | null;
  gender: Gender;
  weight_class_id: string | null;
}): string {
  return `${f.age_category_id ?? "none"}:${f.gender}:${f.weight_class_id ?? "none"}`;
}

export function fighterSectionLabel(
  f: Pick<Fighter, "age_category" | "gender" | "weight_class">
): string {
  return `${f.age_category?.name ?? "Uncategorized"} · ${f.gender} · ${f.weight_class?.name ?? "No class"}`;
}

export function groupFightersBySection(fighters: Fighter[]): Map<string, Fighter[]> {
  const groups = new Map<string, Fighter[]>();
  for (const fighter of fighters) {
    const key = fighterSectionKey(fighter);
    const list = groups.get(key) ?? [];
    list.push(fighter);
    groups.set(key, list);
  }
  return groups;
}
