"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createBracket, getFighters } from "@boutforge/api";
import {
  generateBracketBouts,
  fighterFullName,
  fighterRecord,
} from "@boutforge/shared";
import type { Fighter, FixtureFormat } from "@boutforge/shared";

export default function NewFixturePage() {
  const router = useRouter();
  const supabase = createClient();
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<FixtureFormat>("progressive_knockout");
  const [name, setName] = useState("");
  const [byeFighterId, setByeFighterId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id)
        .single();
      if (!membership) return;
      setClubId(membership.club_id);
      const data = await getFighters(supabase, membership.club_id);
      setFighters(data);
    }
    load();
  }, [supabase]);

  const selectedFighters = fighters.filter((f) => selected.has(f.id));

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

  function toggleFighter(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handlePublish() {
    if (!clubId || selected.size < 2) return;
    setLoading(true);
    setError("");
    try {
      const { bracket } = await createBracket(supabase, clubId, {
        name: name || `Fixture ${new Date().toLocaleDateString("en-IN")}`,
        format,
        fighter_ids: Array.from(selected),
        bye_fighter_id: byeFighterId ?? undefined,
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
          <h2 className="font-semibold text-navy">Step 1 — Select fighters</h2>
          <p className="text-sm text-gray-500">
            Select fighters in the same age, gender, and weight category.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fighters.map((f) => (
              <label
                key={f.id}
                className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggleFighter(f.id)}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{fighterFullName(f)}</p>
                  <p className="text-xs text-gray-500">
                    {f.age_category?.name} · {f.gender} · {f.weight_class?.name} ·{" "}
                    {fighterRecord(f)}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="btn-primary"
            disabled={selected.size < 2}
          >
            Next — {selected.size} fighters selected
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 2 — Choose format</h2>
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
                    {fighterFullName(f)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Next — Preview bracket
            </button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 3 — Review & publish</h2>
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
