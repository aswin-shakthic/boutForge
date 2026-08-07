"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAgeCategories,
  getEventCategoryConfig,
  getWeightClasses,
  saveEventCategoryConfig,
} from "@boutforge/api";
import {
  attachPlatformWeightIds,
  buildDefaultEventCategoryConfig,
  configToCategoryDrafts,
  configToWeightClassDrafts,
  eventConfigFromWizardState,
  type EventCategoryConfig,
  type Gender,
} from "@boutforge/shared";
import { LoadingOverlay } from "@/components/LoadingOverlay";

type CategoryRow = ReturnType<typeof configToCategoryDrafts>[number];
type WeightRow = ReturnType<typeof configToWeightClassDrafts>[number];

export function EventCategoriesEditor({ eventId }: { eventId: string }) {
  const supabase = createClient();
  const [competitionYear, setCompetitionYear] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const config = await getEventCategoryConfig(supabase, eventId);
        if (!active || !config) return;

        setCompetitionYear(config.competition_year);
        setCategories(configToCategoryDrafts(config));
        setWeightClasses(configToWeightClassDrafts(config));
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load categories");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [eventId, supabase]);

  const categoryCodes = useMemo(
    () => new Map(categories.map((c) => [c.id, c.code])),
    [categories]
  );

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const updateCategoryYears = useCallback(
    (id: string, field: "birth_year_from" | "birth_year_to", value: string) => {
      const num = parseInt(value, 10);
      if (!Number.isInteger(num)) return;
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, [field]: num } : cat))
      );
      setSaved(false);
    },
    []
  );

  const updateWeightField = useCallback(
    (
      id: string,
      field: "name" | "min_weight_kg" | "max_weight_kg" | "gender",
      value: string
    ) => {
      setWeightClasses((prev) =>
        prev.map((wc) =>
          wc.id === id
            ? {
                ...wc,
                [field]: field === "gender" ? (value as Gender) : value,
              }
            : wc
        )
      );
      setSaved(false);
    },
    []
  );

  const removeWeightClass = useCallback((id: string) => {
    setWeightClasses((prev) => prev.filter((wc) => wc.id !== id));
    setSaved(false);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const config: EventCategoryConfig = eventConfigFromWizardState({
        competitionYear,
        categories,
        weightClasses,
        categoryCodes,
      });
      await saveEventCategoryConfig(supabase, eventId, config);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save categories");
    } finally {
      setSaving(false);
    }
  }

  async function resetDefaults() {
    setSaved(false);
    try {
      const [platformCategories, platformWeights] = await Promise.all([
        getAgeCategories(supabase),
        getWeightClasses(supabase),
      ]);
      const config = attachPlatformWeightIds(
        buildDefaultEventCategoryConfig(competitionYear, platformCategories),
        platformCategories,
        platformWeights
      );
      setCategories(configToCategoryDrafts(config));
      setWeightClasses(configToWeightClassDrafts(config));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset categories");
    }
  }

  return (
    <LoadingOverlay loading={loading || saving} label={saving ? "Saving…" : "Loading categories…"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-navy">Age & weight categories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Birth years shift with the competition year. Weights use min inclusive, max
              exclusive (e.g. 48–52 kg includes 48 up to but not including 52).
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={resetDefaults}>
              Reset defaults
            </button>
            <button type="button" className="btn-primary text-sm" onClick={handleSave}>
              Save for event
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        {saved && (
          <div className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">
            Event categories saved.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Competition year</label>
          <input
            type="number"
            className="input-field max-w-[10rem]"
            value={competitionYear}
            onChange={(e) => {
              setCompetitionYear(parseInt(e.target.value, 10) || new Date().getFullYear());
              setSaved(false);
            }}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-navy">Age categories</p>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem] items-end border border-gray-100 rounded-lg p-3"
            >
              <div>
                <p className="text-sm font-medium text-navy">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.code}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Birth from</label>
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
                <label className="block text-xs text-gray-500 mb-1">Birth to</label>
                <input
                  type="number"
                  className="input-field text-sm"
                  value={cat.birth_year_to}
                  onChange={(e) =>
                    updateCategoryYears(cat.id, "birth_year_to", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-navy">Weight classes</p>
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Gender</th>
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Min kg</th>
                  <th className="py-2 pr-2">Max kg</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {weightClasses.map((wc) => (
                  <tr key={wc.id} className="border-b border-gray-50">
                    <td className="py-2 pr-2">
                      {categoryById.get(wc.categoryDraftId)?.name ?? "—"}
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="input-field text-xs py-1"
                        value={wc.gender}
                        onChange={(e) =>
                          updateWeightField(wc.id, "gender", e.target.value)
                        }
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="input-field text-xs py-1"
                        value={wc.name}
                        onChange={(e) => updateWeightField(wc.id, "name", e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="input-field text-xs py-1 w-20"
                        value={wc.min_weight_kg}
                        onChange={(e) =>
                          updateWeightField(wc.id, "min_weight_kg", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        className="input-field text-xs py-1 w-20"
                        placeholder="open"
                        value={wc.max_weight_kg}
                        onChange={(e) =>
                          updateWeightField(wc.id, "max_weight_kg", e.target.value)
                        }
                      />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="text-red-600 text-xs hover:underline"
                        onClick={() => removeWeightClass(wc.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            {weightClasses.length} classes · leave max empty for +weight classes (e.g. +70)
          </p>
        </div>
      </div>
    </LoadingOverlay>
  );
}
