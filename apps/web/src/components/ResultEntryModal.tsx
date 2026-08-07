"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordBoutResult } from "@boutforge/api";
import { boutResultSchema, BOUT_METHOD_LABELS } from "@boutforge/shared";
import type { Bout, Fighter } from "@boutforge/shared";
import { fighterFullName } from "@boutforge/shared";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export function ResultEntryModal({
  bout,
  onClose,
  onRecorded,
}: {
  bout: Bout;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const supabase = createClient();
  const [winnerId, setWinnerId] = useState<string>("");
  const [method, setMethod] = useState<string>("UD");
  const [roundEnded, setRoundEnded] = useState<number>(3);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fighterA = bout.fighter_a as Fighter | null;
  const fighterB = bout.fighter_b as Fighter | null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = boutResultSchema.safeParse({
      winner_id: method === "DRAW" || method === "NC" ? null : winnerId,
      method,
      round_ended: roundEnded,
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      await recordBoutResult(supabase, bout.id, parsed.data);
      onRecorded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record result");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <LoadingOverlay loading={loading} label="Saving result…">
      <div className="card max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-navy mb-4">Enter Result</h2>
        <p className="text-sm text-gray-500 mb-4">
          {fighterA ? fighterFullName(fighterA) : "TBD"} vs{" "}
          {fighterB ? fighterFullName(fighterB) : "TBD"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Winner</label>
            <select
              className="input-field"
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              required={method !== "DRAW" && method !== "NC"}
            >
              <option value="">Select winner</option>
              {fighterA && (
                <option value={fighterA.id}>{fighterFullName(fighterA)}</option>
              )}
              {fighterB && (
                <option value={fighterB.id}>{fighterFullName(fighterB)}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              className="input-field"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {Object.entries(BOUT_METHOD_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Round ended</label>
            <input
              type="number"
              min={1}
              max={12}
              className="input-field"
              value={roundEnded}
              onChange={(e) => setRoundEnded(parseInt(e.target.value))}
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "Saving..." : "Record Result"}
            </button>
          </div>
        </form>
      </div>
      </LoadingOverlay>
    </div>
  );
}
