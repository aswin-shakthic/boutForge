"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  assignFightersToFixtureSection,
  createBracket,
  createFixtureAgeCategory,
  createFixtureWeightClass,
  getAgeCategories,
  getFighters,
  getUserClubs,
  updateFixtureAgeCategory,
} from "@boutforge/api";
import {
  fighterFullName,
  fighterRecord,
  generateBracketBouts,
  getFighterClubDisplayName,
  fixtureSectionKey,
  resolveCategoryBirthYears,
  eligibleFightersForSection,
  getReadyFixtureSections,
  parseWeightInput,
  toggleSectionFighterSelection,
  pruneFixtureWizardState,
} from "@boutforge/shared";
import type {
  AgeCategory,
  ClubMember,
  Fighter,
  FixtureFormat,
  Gender,
} from "@boutforge/shared";

type CategoryDraft = {
  id: string;
  sourceId: string | null;
  name: string;
  birth_year_from: number;
  birth_year_to: number;
  isDefault: boolean;
};

type WeightClassDraft = {
  id: string;
  categoryDraftId: string;
  name: string;
  gender: Gender;
  min_weight_kg: string;
  max_weight_kg: string;
};

function newId() {
  return crypto.randomUUID();
}

function parseWeight(value: string): number | null {
  return parseWeightInput(value);
}

type SectionConfig = {
  format: FixtureFormat;
  name: string;
  byeFighterId: string | null;
};

function defaultSectionName(section: {
  category: CategoryDraft;
  weightClass: WeightClassDraft;
}) {
  return `${section.category.name} ${section.weightClass.gender} ${section.weightClass.name}`.trim();
}

function defaultSectionConfig(section: {
  category: CategoryDraft;
  weightClass: WeightClassDraft;
}): SectionConfig {
  return {
    format: "progressive_knockout",
    name: defaultSectionName(section),
    byeFighterId: null,
  };
}

function toCategoryDraft(
  category: AgeCategory,
  competitionYear: number
): CategoryDraft {
  const years = resolveCategoryBirthYears(category, competitionYear);
  return {
    id: category.id,
    sourceId: category.id,
    name: category.name,
    birth_year_from: years.birth_year_from,
    birth_year_to: years.birth_year_to,
    isDefault: !category.is_custom && category.club_id === null,
  };
}

export default function NewFixturePage() {
  const router = useRouter();
  const supabase = createClient();
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [hostClubId, setHostClubId] = useState("");
  const [competitionYear, setCompetitionYear] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClassDraft[]>([]);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    birth_year_from: "",
    birth_year_to: "",
  });
  const [weightForm, setWeightForm] = useState({
    categoryDraftId: "",
    name: "",
    gender: "male" as Gender,
    min_weight_kg: "",
    max_weight_kg: "",
  });
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [selectedBySection, setSelectedBySection] = useState<Record<string, string[]>>({});
  const [configBySection, setConfigBySection] = useState<Record<string, SectionConfig>>({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const clubs = await getUserClubs(supabase, user.id);
      setMemberships(clubs);
      if (clubs.length > 0) {
        setHostClubId(clubs[0].club_id);
        setSelectedClubIds(new Set([clubs[0].club_id]));
      }
    }
    load();
  }, [supabase]);

  useEffect(() => {
    async function loadCategories() {
      if (!hostClubId) return;

      const all = await getAgeCategories(supabase);
      const visible = all.filter(
        (cat) => cat.club_id === null || cat.club_id === hostClubId
      );

      setCategories((prev) => {
        const additional = prev.filter((cat) => cat.sourceId === null);
        const loaded = visible.map((cat) => toCategoryDraft(cat, competitionYear));
        return [...loaded, ...additional];
      });
    }
    loadCategories();
  }, [supabase, hostClubId]);

  useEffect(() => {
    async function loadFighters() {
      if (selectedClubIds.size === 0) {
        setFighters([]);
        return;
      }
      const data = await getFighters(supabase, Array.from(selectedClubIds));
      setFighters(data);
    }
    loadFighters();
  }, [supabase, selectedClubIds]);

  const sections = useMemo(() => {
    return weightClasses.map((wc) => {
      const category = categories.find((c) => c.id === wc.categoryDraftId);
      if (!category) return null;
      const key = fixtureSectionKey(category.id, wc.id);
      return { key, category, weightClass: wc };
    }).filter(Boolean) as Array<{
      key: string;
      category: CategoryDraft;
      weightClass: WeightClassDraft;
    }>;
  }, [categories, weightClasses]);

  const readySections = useMemo(
    () => getReadyFixtureSections(sections, selectedBySection),
    [sections, selectedBySection]
  );

  function eligibleForSection(section: (typeof sections)[number]) {
    return eligibleFightersForSection(section, fighters, selectedBySection);
  }

  function getSectionConfig(section: (typeof sections)[number]): SectionConfig {
    return configBySection[section.key] ?? defaultSectionConfig(section);
  }

  function updateSectionConfig(
    sectionKey: string,
    section: (typeof sections)[number],
    patch: Partial<SectionConfig>
  ) {
    setConfigBySection((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? defaultSectionConfig(section)), ...patch },
    }));
  }

  function sectionPreview(section: (typeof sections)[number]) {
    const fighterIds = selectedBySection[section.key] ?? [];
    const sectionFighters = fighters.filter((f) => fighterIds.includes(f.id));
    const config = getSectionConfig(section);
    if (sectionFighters.length < 2) return null;
    return generateBracketBouts(
      config.format,
      sectionFighters.map((f) => ({
        id: f.id,
        first_name: f.first_name,
        last_name: f.last_name,
        dob: f.dob,
        gender: f.gender,
        weight_kg: f.weight_kg,
        wins: f.wins,
        losses: f.losses,
        draws: f.draws,
        last_bout_at: f.last_bout_at,
      })),
      config.byeFighterId
    );
  }

  function addCategory() {
    const from = parseInt(categoryForm.birth_year_from, 10);
    const to = parseInt(categoryForm.birth_year_to, 10);
    if (!categoryForm.name.trim() || !Number.isInteger(from) || !Number.isInteger(to)) {
      setError("Additional category needs a name and valid birth year range.");
      return;
    }
    setCategories((prev) => [
      ...prev,
      {
        id: newId(),
        sourceId: null,
        name: categoryForm.name.trim(),
        birth_year_from: from,
        birth_year_to: to,
        isDefault: false,
      },
    ]);
    setCategoryForm({ name: "", birth_year_from: "", birth_year_to: "" });
    setError("");
  }

  function updateCategoryYears(
    id: string,
    field: "birth_year_from" | "birth_year_to",
    value: string
  ) {
    const num = parseInt(value, 10);
    if (!Number.isInteger(num)) return;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, [field]: num } : cat))
    );
  }

  function removeCategory(id: string) {
    const target = categories.find((cat) => cat.id === id);
    if (!target || target.isDefault) return;

    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    setWeightClasses((prev) => prev.filter((wc) => wc.categoryDraftId !== id));
    setError("");
  }

  function addWeightClass() {
    if (!weightForm.categoryDraftId || !weightForm.name.trim()) {
      setError("Pick a category and enter a weight class name.");
      return;
    }
    setWeightClasses((prev) => [
      ...prev,
      {
        id: newId(),
        categoryDraftId: weightForm.categoryDraftId,
        name: weightForm.name.trim(),
        gender: weightForm.gender,
        min_weight_kg: weightForm.min_weight_kg,
        max_weight_kg: weightForm.max_weight_kg,
      },
    ]);
    setWeightForm((prev) => ({
      ...prev,
      name: "",
      min_weight_kg: "",
      max_weight_kg: "",
    }));
    setError("");
  }

  function removeWeightClass(id: string) {
    const nextWeightClasses = weightClasses.filter((wc) => wc.id !== id);
    const validKeys = new Set(
      nextWeightClasses
        .map((wc) => {
          const category = categories.find((c) => c.id === wc.categoryDraftId);
          return category ? fixtureSectionKey(category.id, wc.id) : null;
        })
        .filter((key): key is string => key != null)
    );

    setWeightClasses(nextWeightClasses);
    setSelectedBySection(
      (prev) => pruneFixtureWizardState(prev, {}, validKeys).selectedBySection
    );
    setConfigBySection(
      (prev) =>
        pruneFixtureWizardState({}, prev, validKeys).configBySection as Record<
          string,
          SectionConfig
        >
    );
  }

  function toggleClub(clubId: string) {
    const next = new Set(selectedClubIds);
    if (next.has(clubId)) next.delete(clubId);
    else next.add(clubId);
    setSelectedClubIds(next);
    setSelectedBySection({});
    setConfigBySection({});
  }

  function toggleFighter(fighterId: string, sectionKey: string) {
    setSelectedBySection((prev) => toggleSectionFighterSelection(fighterId, sectionKey, prev));
  }

  function goToFormatStep() {
    setConfigBySection((prev) => {
      const next = { ...prev };
      for (const section of readySections) {
        if (!next[section.key]) {
          next[section.key] = defaultSectionConfig(section);
        }
      }
      return next;
    });
    setStep(4);
  }

  async function handlePublish() {
    if (!hostClubId || readySections.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const categoryMap = new Map<string, string>();
      for (const cat of categories) {
        if (cat.sourceId) {
          const updated = await updateFixtureAgeCategory(supabase, cat.sourceId, {
            birth_year_from: cat.birth_year_from,
            birth_year_to: cat.birth_year_to,
            competition_year: competitionYear,
          });
          categoryMap.set(cat.id, updated.id);
        } else {
          const created = await createFixtureAgeCategory(supabase, hostClubId, {
            name: cat.name,
            birth_year_from: cat.birth_year_from,
            birth_year_to: cat.birth_year_to,
            competition_year: competitionYear,
          });
          categoryMap.set(cat.id, created.id);
        }
      }

      const weightMap = new Map<string, string>();
      for (const wc of weightClasses) {
        const ageCategoryId = categoryMap.get(wc.categoryDraftId);
        if (!ageCategoryId) continue;
        const created = await createFixtureWeightClass(supabase, hostClubId, {
          name: wc.name,
          gender: wc.gender,
          age_category_id: ageCategoryId,
          min_weight_kg: parseWeight(wc.min_weight_kg),
          max_weight_kg: parseWeight(wc.max_weight_kg),
        });
        weightMap.set(wc.id, created.id);
      }

      let firstBracketId: string | null = null;

      for (const section of readySections) {
        const fighterIds = selectedBySection[section.key] ?? [];
        const config = getSectionConfig(section);
        const ageCategoryId = categoryMap.get(section.category.id);
        const weightClassId = weightMap.get(section.weightClass.id);
        if (!ageCategoryId || !weightClassId) continue;

        await assignFightersToFixtureSection(
          supabase,
          fighterIds,
          ageCategoryId,
          weightClassId
        );

        const { bracket } = await createBracket(supabase, hostClubId, {
          name: config.name || defaultSectionName(section),
          format: config.format,
          fighter_ids: fighterIds,
          bye_fighter_id: config.byeFighterId ?? undefined,
          age_category_id: ageCategoryId,
          weight_class_id: weightClassId,
          gender: section.weightClass.gender,
        });

        if (!firstBracketId) firstBracketId = bracket.id;
      }

      if (!firstBracketId) {
        throw new Error("No brackets were created.");
      }

      router.push("/fixtures");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fixture");
      setLoading(false);
    }
  }

  const stepLabels = [
    "Categories",
    "Weight classes",
    "Assign fighters",
    "Format",
    "Publish",
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/fixtures" className="text-boxing text-sm hover:underline">
          ← Back to fixtures
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Create Fixture</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define age categories by birth year, add weight classes, then assign fighters.
        </p>
        <div className="flex gap-2 mt-4">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  i + 1 <= step ? "bg-boxing" : "bg-gray-200"
                }`}
              />
              <p className="text-[10px] text-gray-500 mt-1 truncate">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 1 — Age categories (birth year)</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Competition year</label>
            <input
              type="number"
              className="input-field max-w-[10rem]"
              value={competitionYear}
              onChange={(e) =>
                setCompetitionYear(parseInt(e.target.value, 10) || new Date().getFullYear())
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Default categories load automatically. Adjust birth year ranges as needed for this
              event.
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-navy">Categories</p>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem_auto] items-end border border-gray-100 rounded-lg p-3"
                >
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <p className="text-sm font-medium text-navy flex items-center gap-2">
                      {cat.name}
                      {cat.isDefault ? (
                        <span className="badge bg-blue-100 text-blue-800 text-[10px]">
                          Default
                        </span>
                      ) : cat.sourceId ? (
                        <span className="badge bg-gray-100 text-gray-700 text-[10px]">
                          Custom
                        </span>
                      ) : (
                        <span className="badge bg-green-100 text-green-800 text-[10px]">
                          New
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Birth year from</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={cat.birth_year_from}
                      onChange={(e) =>
                        updateCategoryYears(cat.id, "birth_year_from", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Birth year to</label>
                    <input
                      type="number"
                      className="input-field text-sm"
                      value={cat.birth_year_to}
                      onChange={(e) =>
                        updateCategoryYears(cat.id, "birth_year_to", e.target.value)
                      }
                    />
                  </div>
                  {!cat.isDefault ? (
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="text-red-600 text-xs hover:underline pb-2"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 pb-2">—</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading categories...</p>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-medium text-navy">Add additional category</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium mb-1">Category name</label>
                <input
                  className="input-field"
                  placeholder="e.g. Novice Boys"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birth year from</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="2010"
                  value={categoryForm.birth_year_from}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, birth_year_from: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birth year to</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="2012"
                  value={categoryForm.birth_year_to}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, birth_year_to: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={addCategory} className="btn-secondary w-full">
                  Add category
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="btn-primary"
            disabled={categories.length === 0}
          >
            Next — Weight classes
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 2 — Weight classes per category</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="input-field"
                value={weightForm.categoryDraftId}
                onChange={(e) =>
                  setWeightForm({ ...weightForm, categoryDraftId: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Weight class name</label>
              <input
                className="input-field"
                placeholder="e.g. 52 kg"
                value={weightForm.name}
                onChange={(e) => setWeightForm({ ...weightForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="input-field"
                value={weightForm.gender}
                onChange={(e) =>
                  setWeightForm({ ...weightForm, gender: e.target.value as Gender })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                placeholder="48"
                value={weightForm.min_weight_kg}
                onChange={(e) =>
                  setWeightForm({ ...weightForm, min_weight_kg: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                placeholder="52"
                value={weightForm.max_weight_kg}
                onChange={(e) =>
                  setWeightForm({ ...weightForm, max_weight_kg: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={addWeightClass} className="btn-secondary w-full">
                Add weight class
              </button>
            </div>
          </div>

          {weightClasses.length > 0 ? (
            <div className="space-y-3">
              {categories.map((cat) => {
                const classes = weightClasses.filter((wc) => wc.categoryDraftId === cat.id);
                if (classes.length === 0) return null;
                return (
                  <div key={cat.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="font-medium text-sm text-navy mb-2">{cat.name}</p>
                    <ul className="space-y-1">
                      {classes.map((wc) => (
                        <li
                          key={wc.id}
                          className="flex justify-between text-sm text-gray-700"
                        >
                          <span>
                            {wc.name} · {wc.gender} ·{" "}
                            {wc.min_weight_kg || "—"}–{wc.max_weight_kg || "—"} kg
                          </span>
                          <button
                            type="button"
                            onClick={() => removeWeightClass(wc.id)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Add at least one weight class.</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-primary"
              disabled={weightClasses.length === 0}
            >
              Next — Assign fighters
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 3 — Assign fighters to sections</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Participating clubs</label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {memberships.map((membership) => (
                <label
                  key={membership.club_id}
                  className="flex items-center gap-2 text-sm p-2 border border-gray-100 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedClubIds.has(membership.club_id)}
                    onChange={() => toggleClub(membership.club_id)}
                  />
                  {membership.club?.name ?? membership.club_id}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section) => {
              const eligible = eligibleForSection(section);
              const selected = selectedBySection[section.key] ?? [];
              return (
                <div
                  key={section.key}
                  className="border border-gray-100 rounded-lg p-4 space-y-3"
                >
                  <div>
                    <p className="font-medium text-sm text-navy">
                      {section.category.name} · {section.weightClass.gender} ·{" "}
                      {section.weightClass.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Born{" "}
                      {Math.min(section.category.birth_year_from, section.category.birth_year_to)}–
                      {Math.max(section.category.birth_year_from, section.category.birth_year_to)}{" "}
                      · {eligible.length} available · {selected.length} selected
                    </p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pt-2 border-t border-gray-100">
                    {eligible.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No available fighters for this section (already assigned elsewhere or no
                        match).
                      </p>
                    ) : (
                      eligible.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(f.id)}
                            onChange={() => toggleFighter(f.id, section.key)}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{fighterFullName(f)}</p>
                            <p className="text-xs text-gray-500">
                              {getFighterClubDisplayName(f)} · {f.weight_kg} kg ·{" "}
                              {fighterRecord(f)}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={goToFormatStep}
              className="btn-primary"
              disabled={readySections.length === 0}
            >
              Next — {readySections.length} bracket
              {readySections.length === 1 ? "" : "s"} ready
            </button>
          </div>
        </div>
      )}

      {step === 4 && readySections.length > 0 && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-navy">Step 4 — Bracket format</h2>
          <p className="text-sm text-gray-500">
            Configure format for each section with at least 2 fighters.
          </p>

          {readySections.map((section) => {
            const config = getSectionConfig(section);
            const fighterIds = selectedBySection[section.key] ?? [];
            const sectionFighters = fighters.filter((f) => fighterIds.includes(f.id));

            return (
              <div
                key={section.key}
                className="border border-gray-100 rounded-lg p-4 space-y-4"
              >
                <p className="font-medium text-sm text-navy">
                  {section.category.name} · {section.weightClass.gender} ·{" "}
                  {section.weightClass.name} · {fighterIds.length} fighters
                </p>

                <div>
                  <label className="block text-sm font-medium mb-1">Bracket name</label>
                  <input
                    className="input-field"
                    value={config.name}
                    onChange={(e) =>
                      updateSectionConfig(section.key, section, { name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  {(
                    [
                      ["progressive_knockout", "Progressive Knockout Bracket (recommended)"],
                      ["round_robin", "Round-Robin Series"],
                      ["manual", "Manual"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={config.format === value}
                        onChange={() =>
                          updateSectionConfig(section.key, section, { format: value })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>

                {fighterIds.length % 2 === 1 &&
                  config.format === "progressive_knockout" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Bye fighter</label>
                      <select
                        className="input-field"
                        value={config.byeFighterId ?? ""}
                        onChange={(e) =>
                          updateSectionConfig(section.key, section, {
                            byeFighterId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Auto-suggest</option>
                        {sectionFighters.map((f) => (
                          <option key={f.id} value={f.id}>
                            {fighterFullName(f)} ({getFighterClubDisplayName(f)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>
            );
          })}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary">
              Back
            </button>
            <button type="button" onClick={() => setStep(5)} className="btn-primary">
              Next — Preview all brackets
            </button>
          </div>
        </div>
      )}

      {step === 5 && readySections.length > 0 && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-navy">Step 5 — Review & publish</h2>
          <p className="text-sm text-gray-500">
            Publishing {readySections.length} bracket
            {readySections.length === 1 ? "" : "s"}.
          </p>

          {readySections.map((section) => {
            const preview = sectionPreview(section);
            const config = getSectionConfig(section);
            const fighterIds = selectedBySection[section.key] ?? [];
            const sectionFighters = fighters.filter((f) => fighterIds.includes(f.id));
            if (!preview) return null;

            return (
              <div
                key={section.key}
                className="border border-gray-100 rounded-lg p-4 space-y-3"
              >
                <p className="font-medium text-sm text-navy">
                  {config.name || defaultSectionName(section)}
                </p>
                <p className="text-xs text-gray-500">
                  {section.category.name} · {section.weightClass.gender} ·{" "}
                  {section.weightClass.name} · {config.format.replace(/_/g, " ")}
                </p>
                {preview.byeFighterId && (
                  <p className="text-sm text-gray-500">
                    Bye:{" "}
                    {fighterFullName(
                      sectionFighters.find((f) => f.id === preview.byeFighterId)!
                    )}
                  </p>
                )}
                <div className="space-y-2">
                  {preview.bouts.map((bout) => (
                    <div
                      key={bout.bout_order}
                      className="border border-gray-100 rounded-lg p-3 text-sm"
                    >
                      <span className="text-gray-500">
                        R{bout.round_number} Bout {bout.bout_order}:
                      </span>{" "}
                      {bout.slot_a_type === "fighter"
                        ? fighterFullName(
                            sectionFighters.find((f) => f.id === bout.fighter_a_id)!
                          )
                        : bout.slot_a_type === "winner_of"
                          ? `Winner(Bout ${bout.source_bout_a_order})`
                          : "TBD"}{" "}
                      vs{" "}
                      {bout.slot_b_type === "fighter"
                        ? fighterFullName(
                            sectionFighters.find((f) => f.id === bout.fighter_b_id)!
                          )
                        : bout.slot_b_type === "bye"
                          ? "BYE"
                          : bout.slot_b_type === "winner_of"
                            ? `Winner(Bout ${bout.source_bout_b_order})`
                            : "TBD"}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(4)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Publishing..." : `Publish ${readySections.length} bracket(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
