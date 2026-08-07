"use client";

import {
  fighterFullName,
  fighterRecord,
  getBracketMatchMarginTop,
  getMatchGameLabel,
  organizeBoutsByRound,
  type Bout,
  type Bracket,
  type Fighter,
} from "@boutforge/shared";
import { reassignBracketFighter } from "@boutforge/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ResultEntryModal } from "./ResultEntryModal";

function sourceLabel(bout: Bout, bouts: Bout[], slot: "a" | "b"): string {
  const sourceId = slot === "a" ? bout.source_bout_a_id : bout.source_bout_b_id;
  if (!sourceId) return "TBD";
  const source = bouts.find((b) => b.id === sourceId);
  return source ? `Winner · Game ${source.bout_order}` : "TBD";
}

function isAssignmentSlot(bout: Bout, slot: "a" | "b"): boolean {
  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  if (slotType === "winner_of") return false;
  if (bout.round_number === 1) return true;
  return slotType === "bye";
}

function isEditableSlot(bout: Bout, slot: "a" | "b"): boolean {
  if (bout.status === "completed" || bout.status === "pending_fighters") return false;
  return isAssignmentSlot(bout, slot);
}

function getAssignedFighterIds(
  bouts: Bout[],
  exclude?: { boutId: string; slot: "a" | "b" }
): Set<string> {
  const assigned = new Set<string>();

  for (const bout of bouts) {
    for (const slot of ["a", "b"] as const) {
      if (!isAssignmentSlot(bout, slot)) continue;
      const fighterId = slot === "a" ? bout.fighter_a_id : bout.fighter_b_id;
      if (!fighterId) continue;
      if (exclude?.boutId === bout.id && exclude.slot === slot) continue;
      assigned.add(fighterId);
    }
  }

  return assigned;
}

function getRemainingFighters(
  fighters: Fighter[],
  bouts: Bout[],
  boutId: string,
  slot: "a" | "b"
): Fighter[] {
  const currentId = (() => {
    const bout = bouts.find((b) => b.id === boutId);
    if (!bout) return null;
    return slot === "a" ? bout.fighter_a_id : bout.fighter_b_id;
  })();

  const assigned = getAssignedFighterIds(bouts, { boutId, slot });
  return fighters.filter((f) => !assigned.has(f.id) || f.id === currentId);
}

function clearSlot(bout: Bout, slot: "a" | "b"): Bout {
  if (slot === "a") {
    return {
      ...bout,
      fighter_a_id: null,
      fighter_a: undefined,
      slot_a_type: "tbd",
    };
  }
  return {
    ...bout,
    fighter_b_id: null,
    fighter_b: undefined,
    slot_b_type: "tbd",
  };
}

function setSlot(bout: Bout, slot: "a" | "b", fighterId: string | null, fighter?: Fighter): Bout {
  if (slot === "a") {
    return {
      ...bout,
      fighter_a_id: fighterId,
      fighter_a: fighter,
      slot_a_type: fighterId ? "fighter" : "tbd",
      status:
        fighterId && (bout.fighter_b_id || bout.slot_b_type === "bye") ? "scheduled" : bout.status,
    };
  }
  const slotType = bout.slot_b_type === "bye" ? "bye" : fighterId ? "fighter" : "tbd";
  return {
    ...bout,
    fighter_b_id: fighterId,
    fighter_b: fighter,
    slot_b_type: slotType,
    status: fighterId && bout.fighter_a_id ? "scheduled" : bout.status,
  };
}

function applyFighterAssignment(
  bouts: Bout[],
  fighters: Fighter[],
  targetBoutId: string,
  targetSlot: "a" | "b",
  fighterId: string | null
): Bout[] {
  const fighter = fighterId ? fighters.find((f) => f.id === fighterId) : undefined;

  return bouts.map((bout) => {
    let next = bout;

    if (fighterId) {
      if (bout.id !== targetBoutId && isEditableSlot(bout, "a") && bout.fighter_a_id === fighterId) {
        next = clearSlot(next, "a");
      }
      if (bout.id !== targetBoutId && isEditableSlot(bout, "b") && bout.fighter_b_id === fighterId) {
        next = clearSlot(next, "b");
      }
    }

    if (bout.id === targetBoutId) {
      next = setSlot(next, targetSlot, fighterId, fighter);
    }

    return next;
  });
}

function slotDisplayName(bout: Bout, slot: "a" | "b", bouts: Bout[]): string {
  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  const fighter = slot === "a" ? bout.fighter_a : bout.fighter_b;

  if (slotType === "bye") return "BYE";
  if (slotType === "winner_of") return sourceLabel(bout, bouts, slot);
  if (fighter) return fighterFullName(fighter);
  return "TBD";
}

function slotScoreMark(bout: Bout, slot: "a" | "b"): string {
  if (bout.status !== "completed" || !bout.result?.winner_id) return "";
  const fighterId = slot === "a" ? bout.fighter_a_id : bout.fighter_b_id;
  if (!fighterId) return "";
  return bout.result.winner_id === fighterId ? "W" : "L";
}

function BracketFixtureRow({
  bout,
  slot,
  fighters,
  bouts,
  canEdit,
  onAssign,
  onRecord,
  canRecord,
}: {
  bout: Bout;
  slot: "a" | "b";
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
  onRecord?: () => void;
  canRecord?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const fighterId = slot === "a" ? bout.fighter_a_id : bout.fighter_b_id;
  const isComplete = bout.status === "completed";
  const winnerId = bout.result?.winner_id;
  const isWinner = isComplete && winnerId === fighterId;
  const isLoser = isComplete && fighterId && winnerId !== fighterId;
  const editable = canEdit && isEditableSlot(bout, slot);
  const options = useMemo(
    () => getRemainingFighters(fighters, bouts, bout.id, slot),
    [fighters, bouts, bout.id, slot]
  );

  async function handleChange(nextId: string) {
    const value = nextId === "" ? null : nextId;
    setSaving(true);
    try {
      await onAssign(bout.id, slot, value);
    } finally {
      setSaving(false);
    }
  }

  const nameClass = [
    "bracket-fixture-name",
    isWinner ? "bracket-fixture-name-winner" : "",
    isLoser ? "bracket-fixture-name-loser" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="bracket-fixture-row">
      <div className={nameClass}>
        {editable ? (
          <select
            className="bracket-fixture-select"
            value={fighterId ?? ""}
            disabled={saving}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">Select fighter…</option>
            {options.map((f) => (
              <option key={f.id} value={f.id}>
                {fighterFullName(f)} ({fighterRecord(f)})
              </option>
            ))}
          </select>
        ) : (
          <span className="bracket-fixture-name-print">{slotDisplayName(bout, slot, bouts)}</span>
        )}
        {canRecord && bout.status === "scheduled" && slot === "b" && onRecord && (
          <button
            type="button"
            onClick={onRecord}
            className="no-print ml-auto text-[10px] text-boxing hover:underline shrink-0"
          >
            Result
          </button>
        )}
      </div>
      <div className="bracket-fixture-score">{slotScoreMark(bout, slot)}</div>
    </div>
  );
}

function BracketFixture({
  bout,
  roundLabel,
  gameIndex,
  isLastRound,
  fighters,
  bouts,
  canEdit,
  canRecord,
  onAssign,
  onRecord,
  marginTop,
}: {
  bout: Bout;
  roundLabel: string;
  gameIndex: number;
  isLastRound: boolean;
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  canRecord: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
  onRecord: () => void;
  marginTop: number;
}) {
  return (
    <div className="bracket-fixture" style={{ top: marginTop }}>
      <p className="bracket-fixture-label">{getMatchGameLabel(roundLabel, gameIndex)}</p>
      <div className="bracket-fixture-box">
        <BracketFixtureRow
          bout={bout}
          slot="a"
          fighters={fighters}
          bouts={bouts}
          canEdit={canEdit}
          onAssign={onAssign}
        />
        <BracketFixtureRow
          bout={bout}
          slot="b"
          fighters={fighters}
          bouts={bouts}
          canEdit={canEdit}
          onAssign={onAssign}
          onRecord={onRecord}
          canRecord={canRecord}
        />
      </div>
      {!isLastRound && <span className="bracket-fixture-connector" aria-hidden />}
    </div>
  );
}

export function BracketView({
  bracket,
  bouts: initialBouts,
  fighters,
  canRecord,
  canEdit = false,
  isDemo = false,
}: {
  bracket: Bracket;
  bouts: Bout[];
  fighters: Fighter[];
  canRecord: boolean;
  canEdit?: boolean;
  isDemo?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [bouts, setBouts] = useState(initialBouts);
  const [selectedBout, setSelectedBout] = useState<Bout | null>(null);

  useEffect(() => {
    setBouts(initialBouts);
  }, [initialBouts]);

  const { rounds, treeHeight } = useMemo(() => organizeBoutsByRound(bouts), [bouts]);

  const handleAssign = useCallback(
    async (boutId: string, slot: "a" | "b", fighterId: string | null) => {
      const nextBouts = applyFighterAssignment(bouts, fighters, boutId, slot, fighterId);
      setBouts(nextBouts);

      if (isDemo) return;

      try {
        await reassignBracketFighter(supabase, bracket.id, boutId, slot, fighterId);
        router.refresh();
      } catch {
        setBouts(bouts);
      }
    },
    [bouts, bracket.id, fighters, isDemo, router, supabase]
  );

  const remainingCount = useMemo(() => {
    const assigned = getAssignedFighterIds(bouts);
    return fighters.filter((f) => !assigned.has(f.id)).length;
  }, [bouts, fighters]);

  const participantCount = useMemo(() => {
    const ids = new Set<string>();
    for (const bout of bouts) {
      if (bout.fighter_a_id) ids.add(bout.fighter_a_id);
      if (bout.fighter_b_id) ids.add(bout.fighter_b_id);
    }
    return ids.size;
  }, [bouts]);

  return (
    <div className="space-y-4">
      <div className="bracket-actions no-print">
        <div className="text-sm text-gray-500">
          {canEdit && (
            <span>
              {remainingCount} unassigned · {fighters.length} fighters in pool
            </span>
          )}
        </div>
        <button type="button" onClick={() => window.print()} className="btn-secondary">
          Print bracket
        </button>
      </div>

      <div id="bracket-print-area" className="bracket-print-sheet p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="bracket-print-title">
            {participantCount > 0
              ? `${participantCount} Fighter Single Elimination Tournament`
              : bracket.name}
          </h1>
          <p className="bracket-print-meta mt-3 font-medium text-gray-700 normal-case">
            {bracket.name}
          </p>
          <p className="bracket-print-meta capitalize">
            {bracket.format.replace(/_/g, " ")} · {bracket.status.replace(/_/g, " ")}
            {bracket.scheduled_date ? ` · ${bracket.scheduled_date}` : ""}
          </p>
        </div>

        {rounds.length === 0 ? (
          <p className="text-center text-gray-500">No matches in this bracket yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="bracket-tree" style={{ minHeight: treeHeight }}>
              {rounds.map((round, roundIndex) => (
                <div
                  key={round.roundNumber}
                  className="bracket-round-col"
                  style={{ minHeight: treeHeight }}
                >
                  <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    {round.label}
                  </p>
                  <div className="relative flex-1" style={{ minHeight: treeHeight - 32 }}>
                  {round.bouts.map((bout, index) => (
                    <BracketFixture
                      key={bout.id}
                      bout={bout}
                      roundLabel={round.label}
                      gameIndex={index}
                      isLastRound={roundIndex === rounds.length - 1}
                      fighters={fighters}
                      bouts={bouts}
                      canEdit={canEdit}
                      canRecord={canRecord}
                      onAssign={handleAssign}
                      onRecord={() => setSelectedBout(bout)}
                      marginTop={getBracketMatchMarginTop(round.roundNumber, index)}
                    />
                  ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {canEdit && (
        <p className="text-sm text-gray-500 no-print">
          Dropdowns show only unassigned fighters. Moving a fighter clears them from the previous
          match automatically.
        </p>
      )}

      {selectedBout && !isDemo && (
        <ResultEntryModal
          bout={selectedBout}
          onClose={() => setSelectedBout(null)}
          onRecorded={() => router.refresh()}
        />
      )}
    </div>
  );
}
