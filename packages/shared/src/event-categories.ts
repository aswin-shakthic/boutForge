import {
  AGE_CATEGORY_TEMPLATES,
  BFI_WEIGHT_CLASSES,
  resolveTemplateBirthYears,
  weightSeedsForAgeCode,
  type WeightClassSeed,
} from "./constants";
import type { AgeCategory, Gender, WeightClass } from "./types";

export interface EventCategoryDraft {
  id: string;
  code: string;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
  enabled: boolean;
  platform_id: string | null;
  isDefault: boolean;
}

export interface EventWeightClassDraft {
  id: string;
  category_id: string;
  category_code: string;
  name: string;
  gender: Gender;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  enabled: boolean;
  platform_id: string | null;
}

export interface EventCategoryConfig {
  competition_year: number;
  categories: EventCategoryDraft[];
  weight_classes: EventWeightClassDraft[];
}

function newDraftId(): string {
  const webCrypto = globalThis as typeof globalThis & {
    crypto?: { randomUUID?: () => string };
  };
  if (webCrypto.crypto?.randomUUID) {
    return webCrypto.crypto.randomUUID();
  }
  return `draft-${Math.random().toString(36).slice(2, 11)}`;
}

function weightClassLookupKey(
  categoryCode: string,
  gender: Gender,
  min_weight_kg: number | null,
  max_weight_kg: number | null
): string {
  return `${categoryCode}:${gender}:${min_weight_kg ?? "null"}:${max_weight_kg ?? "null"}`;
}

function weightSeedKey(seed: WeightClassSeed): string {
  return weightClassLookupKey(
    seed.age_code,
    seed.gender,
    seed.min_weight_kg,
    seed.max_weight_kg
  );
}

export interface PlatformCategoryCatalog {
  categoryByCode: Map<string, AgeCategory>;
  categoryById: Map<string, AgeCategory>;
  platformWeightByKey: Map<string, WeightClass>;
}

export function buildPlatformCategoryCatalog(
  platformCategories: AgeCategory[],
  platformWeights: WeightClass[]
): PlatformCategoryCatalog {
  const categoryByCode = new Map<string, AgeCategory>();
  const categoryById = new Map<string, AgeCategory>();
  const categoryCodeById = new Map<string, string>();
  const platformWeightByKey = new Map<string, WeightClass>();

  for (const category of platformCategories) {
    categoryById.set(category.id, category);
    categoryCodeById.set(category.id, category.code);
    if (category.club_id === null) {
      categoryByCode.set(category.code, category);
    }
  }

  for (const weightClass of platformWeights) {
    if (weightClass.club_id !== null || !weightClass.is_enabled) continue;
    const code = categoryCodeById.get(weightClass.age_category_id) ?? weightClass.age_category_id;
    platformWeightByKey.set(
      weightClassLookupKey(
        code,
        weightClass.gender,
        weightClass.min_weight_kg,
        weightClass.max_weight_kg
      ),
      weightClass
    );
  }

  return { categoryByCode, categoryById, platformWeightByKey };
}

export function buildDefaultEventCategoryConfig(
  competitionYear: number,
  platformCategories: AgeCategory[] = []
): EventCategoryConfig {
  const platformByCode = new Map(
    platformCategories.filter((c) => c.club_id === null).map((c) => [c.code, c])
  );

  const categories: EventCategoryDraft[] = AGE_CATEGORY_TEMPLATES.map((template) => {
    const years = resolveTemplateBirthYears(template, competitionYear);
    const platform = platformByCode.get(template.code);
    return {
      id: platform?.id ?? newDraftId(),
      code: template.code,
      name: template.name,
      birth_year_from: years.birth_year_from,
      birth_year_to: years.birth_year_to,
      enabled: true,
      platform_id: platform?.id ?? null,
      isDefault: true,
    };
  });

  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  const weight_classes: EventWeightClassDraft[] = BFI_WEIGHT_CLASSES.map((seed) => ({
    id: newDraftId(),
    category_id: categoryIdByCode.get(seed.age_code) ?? seed.age_code,
    category_code: seed.age_code,
    name: seed.name,
    gender: seed.gender,
    min_weight_kg: seed.min_weight_kg,
    max_weight_kg: seed.max_weight_kg,
    enabled: true,
    platform_id: null,
  }));

  return { competition_year: competitionYear, categories, weight_classes };
}

export function attachPlatformWeightIds(
  config: EventCategoryConfig,
  platformCategories: AgeCategory[],
  platformWeights: WeightClass[]
): EventCategoryConfig {
  const { categoryByCode, platformWeightByKey } = buildPlatformCategoryCatalog(
    platformCategories,
    platformWeights
  );

  const categories = config.categories.map((cat) => {
    const platform = categoryByCode.get(cat.code);
    return platform
      ? { ...cat, id: platform.id, platform_id: platform.id }
      : cat;
  });

  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  const weight_classes = config.weight_classes.map((draft) => {
    const categoryId = categoryIdByCode.get(draft.category_code) ?? draft.category_id;
    const key = weightClassLookupKey(
      draft.category_code,
      draft.gender,
      draft.min_weight_kg,
      draft.max_weight_kg
    );
    const platform = platformWeightByKey.get(key);
    return {
      ...draft,
      category_id: categoryId,
      platform_id: platform?.id ?? draft.platform_id,
      id: platform?.id ?? draft.id,
    };
  });

  return { ...config, categories, weight_classes };
}

/** Merge saved/partial configs with current templates (e.g. add Junior to legacy 3-category events). */
export function ensureCompleteEventCategoryConfig(
  config: EventCategoryConfig,
  platformCategories: AgeCategory[] = [],
  platformWeights: WeightClass[] = []
): EventCategoryConfig {
  const baseline = attachPlatformWeightIds(
    buildDefaultEventCategoryConfig(config.competition_year, platformCategories),
    platformCategories,
    platformWeights
  );

  const savedByCode = new Map(config.categories.map((c) => [c.code, c]));
  const templateCodes = new Set(baseline.categories.map((c) => c.code));

  const categories = baseline.categories.map((base) => {
    const saved = savedByCode.get(base.code);
    if (!saved) return base;
    return {
      ...base,
      birth_year_from: saved.birth_year_from,
      birth_year_to: saved.birth_year_to,
      enabled: saved.enabled,
      name: saved.name,
    };
  });

  for (const saved of config.categories) {
    if (!templateCodes.has(saved.code)) {
      categories.push(saved);
    }
  }

  const savedWeightByKey = new Map(
    config.weight_classes.map((wc) => [
      weightClassLookupKey(wc.category_code, wc.gender, wc.min_weight_kg, wc.max_weight_kg),
      wc,
    ])
  );

  const weight_classes = baseline.weight_classes.map((base) => {
    const saved = savedWeightByKey.get(
      weightClassLookupKey(base.category_code, base.gender, base.min_weight_kg, base.max_weight_kg)
    );
    if (!saved) return base;
    return {
      ...base,
      name: saved.name,
      enabled: saved.enabled,
      min_weight_kg: saved.min_weight_kg,
      max_weight_kg: saved.max_weight_kg,
    };
  });

  const baselineWeightKeys = new Set(
    baseline.weight_classes.map((wc) =>
      weightClassLookupKey(wc.category_code, wc.gender, wc.min_weight_kg, wc.max_weight_kg)
    )
  );
  for (const saved of config.weight_classes) {
    const key = weightClassLookupKey(
      saved.category_code,
      saved.gender,
      saved.min_weight_kg,
      saved.max_weight_kg
    );
    if (!baselineWeightKeys.has(key)) {
      weight_classes.push(saved);
    }
  }

  return {
    competition_year: config.competition_year,
    categories,
    weight_classes,
  };
}

export function parseEventCategoryConfig(raw: unknown): EventCategoryConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as EventCategoryConfig;
  if (!Array.isArray(value.categories) || !Array.isArray(value.weight_classes)) return null;
  if (typeof value.competition_year !== "number") return null;
  return value;
}

export function configToCategoryDrafts(config: EventCategoryConfig): Array<{
  id: string;
  sourceId: string | null;
  code: string;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
  isDefault: boolean;
}> {
  return config.categories
    .filter((c) => c.enabled)
    .map((c) => ({
      id: c.id,
      sourceId: c.platform_id,
      code: c.code,
      name: c.name,
      birth_year_from: c.birth_year_from,
      birth_year_to: c.birth_year_to,
      isDefault: c.isDefault,
    }));
}

export function configToWeightClassDrafts(config: EventCategoryConfig): Array<{
  id: string;
  categoryDraftId: string;
  name: string;
  gender: Gender;
  min_weight_kg: string;
  max_weight_kg: string;
}> {
  return config.weight_classes
    .filter((wc) => wc.enabled)
    .map((wc) => ({
      id: wc.id,
      categoryDraftId: wc.category_id,
      name: wc.name,
      gender: wc.gender,
      min_weight_kg: wc.min_weight_kg == null ? "" : String(wc.min_weight_kg),
      max_weight_kg: wc.max_weight_kg == null ? "" : String(wc.max_weight_kg),
    }));
}

export function eventConfigFromWizardState(input: {
  competitionYear: number;
  categories: Array<{
    id: string;
    sourceId: string | null;
    code?: string;
    name: string;
    birth_year_from: number;
    birth_year_to: number;
    isDefault: boolean;
  }>;
  weightClasses: Array<{
    id: string;
    categoryDraftId: string;
    name: string;
    gender: Gender;
    min_weight_kg: string;
    max_weight_kg: string;
  }>;
  categoryCodes: Map<string, string>;
}): EventCategoryConfig {
  const categories: EventCategoryDraft[] = input.categories.map((cat) => ({
    id: cat.id,
    code: cat.code ?? input.categoryCodes.get(cat.id) ?? cat.name.toLowerCase().replace(/\s+/g, "_"),
    name: cat.name,
    birth_year_from: cat.birth_year_from,
    birth_year_to: cat.birth_year_to,
    enabled: true,
    platform_id: cat.sourceId,
    isDefault: cat.isDefault,
  }));

  const codeByCategoryId = new Map(categories.map((c) => [c.id, c.code]));

  const weight_classes: EventWeightClassDraft[] = input.weightClasses.map((wc) => ({
    id: wc.id,
    category_id: wc.categoryDraftId,
    category_code: codeByCategoryId.get(wc.categoryDraftId) ?? "",
    name: wc.name,
    gender: wc.gender,
    min_weight_kg: parseFloat(wc.min_weight_kg) || null,
    max_weight_kg: parseFloat(wc.max_weight_kg) || null,
    enabled: true,
    platform_id: null,
  }));

  return {
    competition_year: input.competitionYear,
    categories,
    weight_classes,
  };
}

export function findPlatformWeightClass(
  catalog: PlatformCategoryCatalog,
  input: {
    categoryCode: string;
    gender: Gender;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  }
): WeightClass | undefined {
  if (!catalog.categoryByCode.has(input.categoryCode)) return undefined;
  return catalog.platformWeightByKey.get(
    weightClassLookupKey(
      input.categoryCode,
      input.gender,
      input.min_weight_kg,
      input.max_weight_kg
    )
  );
}

export function categoryResolveCacheKey(category: {
  sourceId: string | null;
  code?: string;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
}): string {
  return [
    category.sourceId ?? "custom",
    category.code ?? category.name,
    category.birth_year_from,
    category.birth_year_to,
  ].join(":");
}

export function weightResolveCacheKey(
  ageCategoryId: string,
  weightClass: {
    gender: Gender;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  }
): string {
  return [
    ageCategoryId,
    weightClass.gender,
    weightClass.min_weight_kg ?? "null",
    weightClass.max_weight_kg ?? "null",
  ].join(":");
}

export function seedWeightClassDrafts(
  categories: Array<{ id: string; code: string }>
): Array<{
  id: string;
  categoryDraftId: string;
  name: string;
  gender: Gender;
  min_weight_kg: string;
  max_weight_kg: string;
}> {
  const idByCode = new Map(categories.map((c) => [c.code, c.id]));
  const drafts: Array<{
    id: string;
    categoryDraftId: string;
    name: string;
    gender: Gender;
    min_weight_kg: string;
    max_weight_kg: string;
  }> = [];

  for (const category of categories) {
    for (const seed of weightSeedsForAgeCode(category.code)) {
      drafts.push({
        id: newDraftId(),
        categoryDraftId: idByCode.get(category.code)!,
        name: seed.name,
        gender: seed.gender,
        min_weight_kg: seed.min_weight_kg == null ? "" : String(seed.min_weight_kg),
        max_weight_kg: seed.max_weight_kg == null ? "" : String(seed.max_weight_kg),
      });
    }
  }

  return drafts;
}

export { weightClassLookupKey, weightSeedKey };
