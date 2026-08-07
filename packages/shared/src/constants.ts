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

export const DEFAULT_AGE_CATEGORIES: Omit<AgeCategory, "id" | "club_id">[] = [
  { name: "Sub-Junior", code: "sub_junior", min_age: 13, max_age: 14, is_custom: false },
  { name: "Youth", code: "youth", min_age: 15, max_age: 18, is_custom: false },
  { name: "Elite", code: "elite", min_age: 19, max_age: 40, is_custom: false },
];

export interface WeightClassSeed {
  name: string;
  gender: Gender;
  age_code: string;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
}

export const BFI_WEIGHT_CLASSES: WeightClassSeed[] = [
  // Elite Male
  { name: "46-49 kg", gender: "male", age_code: "elite", min_weight_kg: 46, max_weight_kg: 49 },
  { name: "52 kg", gender: "male", age_code: "elite", min_weight_kg: 49.01, max_weight_kg: 52 },
  { name: "56 kg", gender: "male", age_code: "elite", min_weight_kg: 52.01, max_weight_kg: 56 },
  { name: "60 kg", gender: "male", age_code: "elite", min_weight_kg: 56.01, max_weight_kg: 60 },
  { name: "64 kg", gender: "male", age_code: "elite", min_weight_kg: 60.01, max_weight_kg: 64 },
  { name: "69 kg", gender: "male", age_code: "elite", min_weight_kg: 64.01, max_weight_kg: 69 },
  { name: "75 kg", gender: "male", age_code: "elite", min_weight_kg: 69.01, max_weight_kg: 75 },
  { name: "81 kg", gender: "male", age_code: "elite", min_weight_kg: 75.01, max_weight_kg: 81 },
  { name: "91 kg", gender: "male", age_code: "elite", min_weight_kg: 81.01, max_weight_kg: 91 },
  { name: "+91 kg", gender: "male", age_code: "elite", min_weight_kg: 91.01, max_weight_kg: null },
  // Elite Female
  { name: "48 kg", gender: "female", age_code: "elite", min_weight_kg: 45, max_weight_kg: 48 },
  { name: "51 kg", gender: "female", age_code: "elite", min_weight_kg: 48.01, max_weight_kg: 51 },
  { name: "54 kg", gender: "female", age_code: "elite", min_weight_kg: 51.01, max_weight_kg: 54 },
  { name: "57 kg", gender: "female", age_code: "elite", min_weight_kg: 54.01, max_weight_kg: 57 },
  { name: "60 kg", gender: "female", age_code: "elite", min_weight_kg: 57.01, max_weight_kg: 60 },
  { name: "64 kg", gender: "female", age_code: "elite", min_weight_kg: 60.01, max_weight_kg: 64 },
  { name: "69 kg", gender: "female", age_code: "elite", min_weight_kg: 64.01, max_weight_kg: 69 },
  { name: "75 kg", gender: "female", age_code: "elite", min_weight_kg: 69.01, max_weight_kg: 75 },
  { name: "81 kg", gender: "female", age_code: "elite", min_weight_kg: 75.01, max_weight_kg: 81 },
  { name: "+81 kg", gender: "female", age_code: "elite", min_weight_kg: 81.01, max_weight_kg: null },
  // Youth Male (same as elite for simplicity)
  { name: "48 kg", gender: "male", age_code: "youth", min_weight_kg: null, max_weight_kg: 48 },
  { name: "51 kg", gender: "male", age_code: "youth", min_weight_kg: 48.01, max_weight_kg: 51 },
  { name: "54 kg", gender: "male", age_code: "youth", min_weight_kg: 51.01, max_weight_kg: 54 },
  { name: "57 kg", gender: "male", age_code: "youth", min_weight_kg: 54.01, max_weight_kg: 57 },
  { name: "60 kg", gender: "male", age_code: "youth", min_weight_kg: 57.01, max_weight_kg: 60 },
  { name: "63 kg", gender: "male", age_code: "youth", min_weight_kg: 60.01, max_weight_kg: 63 },
  { name: "66 kg", gender: "male", age_code: "youth", min_weight_kg: 63.01, max_weight_kg: 66 },
  { name: "70 kg", gender: "male", age_code: "youth", min_weight_kg: 66.01, max_weight_kg: 70 },
  { name: "75 kg", gender: "male", age_code: "youth", min_weight_kg: 70.01, max_weight_kg: 75 },
  { name: "80 kg", gender: "male", age_code: "youth", min_weight_kg: 75.01, max_weight_kg: 80 },
  { name: "+80 kg", gender: "male", age_code: "youth", min_weight_kg: 80.01, max_weight_kg: null },
  // Youth Female
  { name: "48 kg", gender: "female", age_code: "youth", min_weight_kg: null, max_weight_kg: 48 },
  { name: "50 kg", gender: "female", age_code: "youth", min_weight_kg: 48.01, max_weight_kg: 50 },
  { name: "52 kg", gender: "female", age_code: "youth", min_weight_kg: 50.01, max_weight_kg: 52 },
  { name: "54 kg", gender: "female", age_code: "youth", min_weight_kg: 52.01, max_weight_kg: 54 },
  { name: "57 kg", gender: "female", age_code: "youth", min_weight_kg: 54.01, max_weight_kg: 57 },
  { name: "60 kg", gender: "female", age_code: "youth", min_weight_kg: 57.01, max_weight_kg: 60 },
  { name: "63 kg", gender: "female", age_code: "youth", min_weight_kg: 60.01, max_weight_kg: 63 },
  { name: "66 kg", gender: "female", age_code: "youth", min_weight_kg: 63.01, max_weight_kg: 66 },
  { name: "70 kg", gender: "female", age_code: "youth", min_weight_kg: 66.01, max_weight_kg: 70 },
  { name: "75 kg", gender: "female", age_code: "youth", min_weight_kg: 70.01, max_weight_kg: 75 },
  { name: "80 kg", gender: "female", age_code: "youth", min_weight_kg: 75.01, max_weight_kg: 80 },
  { name: "+80 kg", gender: "female", age_code: "youth", min_weight_kg: 80.01, max_weight_kg: null },
  // Sub-Junior Male
  { name: "33-35 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 33, max_weight_kg: 35 },
  { name: "37 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 35.01, max_weight_kg: 37 },
  { name: "40 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 37.01, max_weight_kg: 40 },
  { name: "43 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 40.01, max_weight_kg: 43 },
  { name: "46 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 43.01, max_weight_kg: 46 },
  { name: "49 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 46.01, max_weight_kg: 49 },
  { name: "52 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 49.01, max_weight_kg: 52 },
  { name: "55 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 52.01, max_weight_kg: 55 },
  { name: "58 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 55.01, max_weight_kg: 58 },
  { name: "61 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 58.01, max_weight_kg: 61 },
  { name: "64 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 61.01, max_weight_kg: 64 },
  { name: "67 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 64.01, max_weight_kg: 67 },
  { name: "70 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 67.01, max_weight_kg: 70 },
  { name: "+70 kg", gender: "male", age_code: "sub_junior", min_weight_kg: 70.01, max_weight_kg: null },
  // Sub-Junior Female
  { name: "31-33 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 31, max_weight_kg: 33 },
  { name: "35 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 33.01, max_weight_kg: 35 },
  { name: "37 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 35.01, max_weight_kg: 37 },
  { name: "40 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 37.01, max_weight_kg: 40 },
  { name: "43 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 40.01, max_weight_kg: 43 },
  { name: "46 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 43.01, max_weight_kg: 46 },
  { name: "49 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 46.01, max_weight_kg: 49 },
  { name: "52 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 49.01, max_weight_kg: 52 },
  { name: "55 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 52.01, max_weight_kg: 55 },
  { name: "58 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 55.01, max_weight_kg: 58 },
  { name: "61 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 58.01, max_weight_kg: 61 },
  { name: "64 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 61.01, max_weight_kg: 64 },
  { name: "67 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 64.01, max_weight_kg: 67 },
  { name: "+67 kg", gender: "female", age_code: "sub_junior", min_weight_kg: 67.01, max_weight_kg: null },
];

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
      (wc.min_weight_kg === null || weightKg >= wc.min_weight_kg) &&
      (wc.max_weight_kg === null || weightKg <= wc.max_weight_kg)
  );
  return eligible[0] ?? null;
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
