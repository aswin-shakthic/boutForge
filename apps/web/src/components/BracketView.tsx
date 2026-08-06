"use client";

import {
  fighterFullName,
  fighterRecord,
  type Bout,
  type Bracket,
  type Fighter,
} from "@boutforge/shared";
import { reassignBracketFighter } from "@boutforge/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ResultEntryModal } from "./ResultEntryModal";

interface BracketLayout {
  leftR1: Bout[];
  leftSemi: Bout | null;
  rightSemi: Bout | null;
  rightR1: Bout[];
  finalBout: Bout | null;
}

function organizeBracket(bouts: Bout[]): BracketLayout {
  if (bouts.length === 0) {
    return { leftR1: [], leftSemi: null, rightSemi: null, rightR1: [], finalBout: null };
  }

  const maxRound = Math.max(...bouts.map((b) => b.round_number));
  const finalBout = bouts.find((b) => b.round_number === maxRound) ?? null;
  const semis = bouts
    .filter((b) => b.round_number === maxRound - 1)
    .sort((a, b) => a.bout_order - b.bout_order);

  if (semis.length >= 2) {
    const leftSemi = semis[0];
    const rightSemi = semis[semis.length - 1];
    const leftIds = new Set(
      [leftSemi.source_bout_a_id, leftSemi.source_bout_b_id].filter(Boolean) as string[]
    );
    const rightIds = new Set(
      [rightSemi.source_bout_a_id, rightSemi.source_bout_b_id].filter(Boolean) as string[]
    );

    return {
      leftR1: bouts.filter((b) => leftIds.has(b.id)).sort((a, b) => a.bout_order - b.bout_order),
      leftSemi,
      rightSemi,
      rightR1: bouts.filter((b) => rightIds.has(b.id)).sort((a, b) => a.bout_order - b.bout_order),
      finalBout,
    };
  }

  const round1 = bouts.filter((b) => b.round_number === 1).sort((a, b) => a.bout_order - b.bout_order);
  const mid = Math.ceil(round1.length / 2);
  return {
    leftR1: round1.slice(0, mid),
    leftSemi: semis[0] ?? null,
    rightSemi: semis[1] ?? null,
    rightR1: round1.slice(mid),
    finalBout,
  };
}

function sourceLabel(bout: Bout, bouts: Bout[], slot: "a" | "b"): string {
  const sourceId = slot === "a" ? bout.source_bout_a_id : bout.source_bout_b_id;
  if (!sourceId) return "TBD";
  const source = bouts.find((b) => b.id === sourceId);
  return source ? `Winner · Bout ${source.bout_order}` : "TBD";
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
      status: fighterId && (bout.fighter_b_id || bout.slot_b_type === "bye") ? "scheduled" : bout.status,
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

function FighterSlot({
  bout,
  slot,
  fighters,
  bouts,
  canEdit,
  onAssign,
}: {
  bout: Bout;
  slot: "a" | "b";
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  const fighter = slot === "a" ? bout.fighter_a : bout.fighter_b;
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

  const nodeClass = [
    "bracket-node text-sky-50",
    isWinner ? "bracket-node-winner" : "",
    isLoser ? "bracket-node-loser" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (slotType === "winner_of") {
    return (
      <div className={`${nodeClass} text-sky-200/80 italic`}>
        {sourceLabel(bout, bouts, slot)}
      </div>
    );
  }

  if (editable) {
    return (
      <div className={nodeClass}>
        {slotType === "bye" && (
          <span className="text-[10px] uppercase tracking-wide text-sky-300/70 block mb-1">
            Bye
          </span>
        )}
        <select
          className="bracket-node-select"
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
        {options.length <= 1 && !fighterId && (
          <p className="text-[10px] text-sky-300/60 mt-1">No fighters left</p>
        )}
      </div>
    );
  }

  return (
    <div className={nodeClass}>
      {slotType === "bye" && (
        <span className="text-[10px] uppercase tracking-wide text-sky-300/70">Bye</span>
      )}
      <p className="font-semibold truncate">
        {fighter ? fighterFullName(fighter) : "TBD"}
      </p>
      {fighter && (
        <p className="text-[11px] text-sky-200/70 mt-0.5">{fighterRecord(fighter)}</p>
      )}
      {isComplete && bout.result && isWinner && (
        <p className="text-[10px] text-emerald-300 mt-1">
          {bout.result.method} · R{bout.result.round_ended}
        </p>
      )}
    </div>
  );
}

function MatchPair({
  bout,
  fighters,
  bouts,
  canEdit,
  canRecord,
  onAssign,
  onRecord,
}: {
  bout: Bout;
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  canRecord: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
  onRecord: () => void;
}) {
  const isComplete = bout.status === "completed";
  const canEnterResult = canRecord && bout.status === "scheduled";

  return (
    <div className="bracket-match">
      <FighterSlot
        bout={bout}
        slot="a"
        fighters={fighters}
        bouts={bouts}
        canEdit={canEdit}
        onAssign={onAssign}
      />
      <FighterSlot
        bout={bout}
        slot="b"
        fighters={fighters}
        bouts={bouts}
        canEdit={canEdit}
        onAssign={onAssign}
      />
      {canEnterResult && (
        <button
          type="button"
          onClick={onRecord}
          className="mt-1 text-[11px] font-medium text-sky-300 hover:text-white transition-colors"
        >
          Enter result →
        </button>
      )}
      {isComplete && (
        <span className="mt-1 inline-flex text-[10px] uppercase tracking-wide text-emerald-300">
          Complete
        </span>
      )}
    </div>
  );
}

function BracketColumn({
  boutsInColumn,
  fighters,
  bouts,
  canEdit,
  canRecord,
  onAssign,
  onRecord,
  isLast,
  className = "",
}: {
  boutsInColumn: Bout[];
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  canRecord: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
  onRecord: (bout: Bout) => void;
  isLast?: boolean;
  className?: string;
}) {
  if (boutsInColumn.length === 0) return null;

  return (
    <div
      className={`flex flex-col justify-around gap-8 py-6 pr-8 ${isLast ? "bracket-column-last" : ""} ${className}`}
    >
      {boutsInColumn.map((bout) => (
        <MatchPair
          key={bout.id}
          bout={bout}
          fighters={fighters}
          bouts={bouts}
          canEdit={canEdit}
          canRecord={canRecord}
          onAssign={onAssign}
          onRecord={() => onRecord(bout)}
        />
      ))}
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

  const layout = useMemo(() => organizeBracket(bouts), [bouts]);

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

  const champion =
    layout.finalBout?.status === "completed" && layout.finalBout.result?.winner_id
      ? layout.finalBout.fighter_a?.id === layout.finalBout.result.winner_id
        ? layout.finalBout.fighter_a
        : layout.finalBout.fighter_b
      : null;

  return (
    <div className="space-y-4">
      <div className="bracket-shell p-6 md:p-8">
        <div className="text-center mb-8">
          <p className="text-sky-300/60 text-xs uppercase tracking-[0.35em]">Playoffs</p>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-sky-100 mt-2">
            {bracket.name}
          </h1>
          <p className="text-sky-300/50 text-sm mt-2 capitalize">
            {bracket.format.replace("_", " ")} · {bracket.status.replace("_", " ")}
          </p>
          {canEdit && (
            <p className="text-sky-300/70 text-xs mt-3">
              {remainingCount} unassigned · {fighters.length} fighters in pool
            </p>
          )}
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[920px] flex items-stretch justify-center gap-2">
            <BracketColumn
              boutsInColumn={layout.leftR1}
              fighters={fighters}
              bouts={bouts}
              canEdit={canEdit}
              canRecord={canRecord}
              onAssign={handleAssign}
              onRecord={setSelectedBout}
            />

            {layout.leftSemi && (
              <BracketColumn
                boutsInColumn={[layout.leftSemi]}
                fighters={fighters}
                bouts={bouts}
                canEdit={canEdit}
                canRecord={canRecord}
                onAssign={handleAssign}
                onRecord={setSelectedBout}
                className="justify-center"
              />
            )}

            <div className="flex flex-col items-center justify-center px-4 min-w-[14rem]">
              <p className="text-sky-300/70 text-xs uppercase tracking-[0.25em] mb-3">
                Final Stage
              </p>
              {champion && (
                <div className="bracket-node bracket-node-winner w-full text-center mb-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300">Champion</p>
                  <p className="font-bold text-sky-50">{fighterFullName(champion)}</p>
                </div>
              )}
              {layout.finalBout ? (
                <MatchPair
                  bout={layout.finalBout}
                  fighters={fighters}
                  bouts={bouts}
                  canEdit={canEdit}
                  canRecord={canRecord}
                  onAssign={handleAssign}
                  onRecord={() => setSelectedBout(layout.finalBout!)}
                />
              ) : (
                <div className="bracket-node text-sky-200/60 italic">Final TBD</div>
              )}
            </div>

            {layout.rightSemi && (
              <BracketColumn
                boutsInColumn={[layout.rightSemi]}
                fighters={fighters}
                bouts={bouts}
                canEdit={canEdit}
                canRecord={canRecord}
                onAssign={handleAssign}
                onRecord={setSelectedBout}
                className="justify-center pl-8 pr-0"
              />
            )}

            <BracketColumn
              boutsInColumn={layout.rightR1}
              fighters={fighters}
              bouts={bouts}
              canEdit={canEdit}
              canRecord={canRecord}
              onAssign={handleAssign}
              onRecord={setSelectedBout}
              isLast
              className="pl-8 pr-0"
            />
          </div>
        </div>
      </div>

      {canEdit && (
        <p className="text-sm text-gray-500">
          Dropdowns show only unassigned fighters. Moving a fighter clears them from the previous node automatically.
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
