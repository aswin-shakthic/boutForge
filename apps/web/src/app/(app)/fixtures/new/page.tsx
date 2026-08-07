"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  createBracket,
  getAgeCategories,
  getFighters,
  getUserClubs,
  getWeightClasses,
} from "@boutforge/api";
import {
  generateBracketBouts,
  fighterFullName,
  fighterRecord,
  fighterSectionLabel,
  groupFightersBySection,
} from "@boutforge/shared";
import type {
  AgeCategory,
  ClubMember,
  Fighter,
  FixtureFormat,
  Gender,
  WeightClass,
} from "@boutforge/shared";

export default function NewFixturePage() {
  const router = useRouter();
  const supabase = createClient();
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>([]);
  const [weightClasses, setWeightClasses] = useState<WeightClass[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [sectionWeightOverrides, setSectionWeightOverrides] = useState<
    Record<string, string>
  >({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<FixtureFormat>("progressive_knockout");
  const [name, setName] = useState("");
  const [byeFighterId, setByeFighterId] = useState<string | null>(null);
  const [ageCategoryId, setAgeCategoryId] = useState<string>("");
  const [weightClassId, setWeightClassId] = useState<string>("");
  const [gender, setGender] = useState<Gender>("male");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [clubs, categories, classes] = await Promise.all([
        getUserClubs(supabase, user.id),
        getAgeCategories(supabase),
        getWeightClasses(supabase),
      ]);

      setMemberships(clubs);
      setAgeCategories(categories);
      setWeightClasses(classes);

      if (clubs.length > 0) {
        const defaultClubId = clubs[0].club_id;
        setSelectedClubIds(new Set([defaultClubId]));
      }
    }
    load();
  }, [supabase]);

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

  const sections = useMemo(
    () => Array.from(groupFightersBySection(fighters).entries()),
    [fighters]
  );

  const activeSection = sections.find(([key]) => key === activeSectionKey);
  const selectedFighters = fighters.filter((f) => selected.has(f.id));

  const filteredWeightClasses = useMemo(
    () =>
      weightClasses.filter(
        (wc) =>
          wc.gender === gender &&
          (!ageCategoryId || wc.age_category_id === ageCategoryId)
      ),
    [weightClasses, gender, ageCategoryId]
  );

  const preview =
    selectedFighters.length >= 2
      ? generateBracketBouts(
          format,
          selectedFighters.map((f) => ({
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
          byeFighterId
        )
      : null;

  function toggleClub(clubId: string) {
    const next = new Set(selectedClubIds);
    if (next.has(clubId)) next.delete(clubId);
    else next.add(clubId);
    setSelectedClubIds(next);
    setSelected(new Set());
    setActiveSectionKey(null);
  }

  function selectSection(sectionKey: string, sectionFighters: Fighter[]) {
    setActiveSectionKey(sectionKey);
    setSelected(new Set());
    const sample = sectionFighters[0];
    if (!sample) return;

    setAgeCategoryId(sample.age_category_id ?? "");
    setGender(sample.gender);
    setWeightClassId(
      sectionWeightOverrides[sectionKey] ?? sample.weight_class_id ?? ""
    );

    const weightName =
      weightClasses.find(
        (wc) =>
          wc.id ===
          (sectionWeightOverrides[sectionKey] ?? sample.weight_class_id)
      )?.name ?? sample.weight_class?.name;
    const ageName = sample.age_category?.name ?? "Open";
    setName((prev) =>
      prev.trim()
        ? prev
        : `${ageName} ${sample.gender} ${weightName ?? ""}`.trim()
    );
  }

  function updateSectionWeightClass(sectionKey: string, weightClassId: string) {
    setSectionWeightOverrides((prev) => ({ ...prev, [sectionKey]: weightClassId }));
    if (activeSectionKey === sectionKey) {
      setWeightClassId(weightClassId);
    }
  }

  function toggleFighter(id: string, sectionKey: string) {
    if (activeSectionKey !== sectionKey) {
      const sectionFighters = sections.find(([key]) => key === sectionKey)?.[1] ?? [];
      selectSection(sectionKey, sectionFighters);
    }

    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handlePublish() {
    const hostClubId = memberships[0]?.club_id;
    if (!hostClubId || selected.size < 2) return;

    setLoading(true);
    setError("");
    try {
      const { bracket } = await createBracket(supabase, hostClubId, {
        name: name || `Fixture ${new Date().toLocaleDateString("en-IN")}`,
        format,
        fighter_ids: Array.from(selected),
        bye_fighter_id: byeFighterId ?? undefined,
        age_category_id: ageCategoryId || undefined,
        weight_class_id: weightClassId || undefined,
        gender,
      });
      router.push(`/fixtures/${bracket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fixture");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/fixtures" className="text-boxing text-sm hover:underline">
          ← Back to fixtures
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Create Fixture</h1>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? "bg-boxing" : "bg-gray-200"
              }`}
            />
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
          <h2 className="font-semibold text-navy">Step 1 — Select clubs & fighters</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Participating clubs</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
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

          {sections.length === 0 ? (
            <p className="text-sm text-gray-500">
              Select at least one club with active fighters.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Pick a section, adjust its weight class if needed, then select fighters
                (minimum 2 from the same section).
              </p>
              {sections.map(([sectionKey, sectionFighters]) => {
                const sample = sectionFighters[0];
                const sectionGender = sample.gender;
                const sectionAgeId = sample.age_category_id ?? "";
                const sectionWeights = weightClasses.filter(
                  (wc) =>
                    wc.gender === sectionGender &&
                    (!sectionAgeId || wc.age_category_id === sectionAgeId)
                );
                const currentWeightId =
                  sectionWeightOverrides[sectionKey] ??
                  sample.weight_class_id ??
                  "";

                return (
                  <div
                    key={sectionKey}
                    className={`border rounded-lg p-4 space-y-3 ${
                      activeSectionKey === sectionKey
                        ? "border-boxing bg-red-50/40"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => selectSection(sectionKey, sectionFighters)}
                        className="text-left"
                      >
                        <p className="font-medium text-sm text-navy">
                          {fighterSectionLabel(sample)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sectionFighters.length} fighters
                        </p>
                      </button>
                      <div className="min-w-[12rem]">
                        <label className="block text-xs text-gray-500 mb-1">
                          Weight class
                        </label>
                        <select
                          className="input-field text-sm"
                          value={currentWeightId}
                          onChange={(e) =>
                            updateSectionWeightClass(sectionKey, e.target.value)
                          }
                        >
                          <option value="">Select weight class</option>
                          {sectionWeights.map((wc) => (
                            <option key={wc.id} value={wc.id}>
                              {wc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {activeSectionKey === sectionKey && (
                      <div className="space-y-2 max-h-64 overflow-y-auto pt-2 border-t border-gray-100">
                        {sectionFighters.map((f) => (
                          <label
                            key={f.id}
                            className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(f.id)}
                              onChange={() => toggleFighter(f.id, sectionKey)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{fighterFullName(f)}</p>
                              <p className="text-xs text-gray-500">
                                {f.club?.name ?? "—"} · {f.weight_kg} kg ·{" "}
                                {fighterRecord(f)}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            className="btn-primary"
            disabled={selected.size < 2 || !activeSectionKey}
          >
            Next — {selected.size} fighters selected
          </button>
        </div>
      )}

      {step === 2 && activeSection && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 2 — Section & format</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Age category</label>
              <select
                className="input-field"
                value={ageCategoryId}
                onChange={(e) => {
                  setAgeCategoryId(e.target.value);
                  setWeightClassId("");
                }}
              >
                <option value="">Select age category</option>
                {ageCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                className="input-field"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as Gender);
                  setWeightClassId("");
                }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Weight class</label>
              <select
                className="input-field"
                value={weightClassId}
                onChange={(e) => setWeightClassId(e.target.value)}
              >
                <option value="">Select weight class</option>
                {filteredWeightClasses.map((wc) => (
                  <option key={wc.id} value={wc.id}>
                    {wc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bracket name</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Youth Male 60kg — July 2026"
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
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                {label}
              </label>
            ))}
          </div>
          {selected.size % 2 === 1 && format === "progressive_knockout" && (
            <div>
              <label className="block text-sm font-medium mb-1">Bye fighter</label>
              <select
                className="input-field"
                value={byeFighterId ?? ""}
                onChange={(e) => setByeFighterId(e.target.value || null)}
              >
                <option value="">Auto-suggest</option>
                {selectedFighters.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fighterFullName(f)} ({f.club?.name})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-primary"
              disabled={!weightClassId}
            >
              Next — Preview bracket
            </button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 3 — Review & publish</h2>
          <p className="text-sm text-gray-500">
            {ageCategories.find((c) => c.id === ageCategoryId)?.name ?? "—"} · {gender} ·{" "}
            {filteredWeightClasses.find((wc) => wc.id === weightClassId)?.name ?? "—"}
          </p>
          {preview.byeFighterId && (
            <p className="text-sm text-gray-500">
              Bye:{" "}
              {fighterFullName(
                selectedFighters.find((f) => f.id === preview.byeFighterId)!
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
                      selectedFighters.find((f) => f.id === bout.fighter_a_id)!
                    )
                  : bout.slot_a_type === "winner_of"
                    ? `Winner(Bout ${bout.source_bout_a_order})`
                    : "TBD"}{" "}
                vs{" "}
                {bout.slot_b_type === "fighter"
                  ? fighterFullName(
                      selectedFighters.find((f) => f.id === bout.fighter_b_id)!
                    )
                  : bout.slot_b_type === "bye"
                    ? "BYE"
                    : bout.slot_b_type === "winner_of"
                      ? `Winner(Bout ${bout.source_bout_b_order})`
                      : "TBD"}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handlePublish}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Bracket"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
