"use client";

import Link from "next/link";
import {
  generateBracketBouts,
  fighterFullName,
  fighterRecord,
} from "@boutforge/shared";
import { MOCK_FIGHTERS_60KG } from "@/lib/mock-data";
import { useState } from "react";

export default function DemoNewFixturePage() {
  const fighters = MOCK_FIGHTERS_60KG;
  const [step, setStep] = useState(3);
  const selected = new Set(fighters.map((f) => f.id));
  const preview = generateBracketBouts(
    "progressive_knockout",
    fighters.map((f) => ({
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
    "f-arjun"
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/demo/fixtures" className="text-boxing text-sm hover:underline">
          ← Back to fixtures
        </Link>
        <h1 className="text-2xl font-bold text-navy mt-2">Create Fixture</h1>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? "bg-boxing" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 1 — Select fighters (Youth · Male · 60kg)</h2>
          <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded">7 eligible fighters selected</p>
          {fighters.map((f) => (
            <label key={f.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <input type="checkbox" checked readOnly />
              <div>
                <p className="font-medium text-sm">{fighterFullName(f)}</p>
                <p className="text-xs text-gray-500">{fighterRecord(f)}</p>
              </div>
            </label>
          ))}
          <button onClick={() => setStep(2)} className="btn-primary">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 2 — Progressive Knockout Bracket</h2>
          <p className="text-sm text-gray-500">Bye fighter: Arjun Das (auto-suggested)</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Preview bracket</button>
          </div>
        </div>
      )}

      {step === 3 && preview && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-navy">Step 3 — Review & publish</h2>
          <p className="text-sm text-gray-500">
            Bye: {fighterFullName(fighters.find((f) => f.id === preview.byeFighterId)!)}
          </p>
          {preview.bouts.map((bout) => (
            <div key={bout.bout_order} className="border rounded-lg p-3 text-sm">
              <span className="text-gray-500">R{bout.round_number} Bout {bout.bout_order}:</span>{" "}
              {bout.slot_a_type === "fighter"
                ? fighterFullName(fighters.find((f) => f.id === bout.fighter_a_id)!)
                : bout.slot_a_type === "winner_of"
                  ? `Winner(Bout ${bout.source_bout_a_order})`
                  : "TBD"}{" "}
              vs{" "}
              {bout.slot_b_type === "fighter"
                ? fighterFullName(fighters.find((f) => f.id === bout.fighter_b_id)!)
                : bout.slot_b_type === "bye"
                  ? "BYE (Arjun)"
                  : bout.slot_b_type === "winner_of"
                    ? `Winner(Bout ${bout.source_bout_b_order})`
                    : "TBD"}
            </div>
          ))}
          <Link href="/demo/fixtures/bracket-youth-60" className="btn-primary inline-block">
            Publish Bracket (demo)
          </Link>
        </div>
      )}
    </div>
  );
}
