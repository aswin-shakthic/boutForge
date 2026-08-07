"use client";

import {
  fighterFullName,
  fighterRecord,
  formatFighterWithClub,
  getFighterClubDisplayName,
  getMatchGameLabel,
  organizeBoutsByRound,
  type Bout,
  type Bracket,
  type Fighter,
} from "@boutforge/shared";
import { reassignBracketFighter, updateBracket } from "@boutforge/api";
import { Check, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { usePendingLoads } from "@/hooks/usePendingLoads";
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

function slotClubName(bout: Bout, slot: "a" | "b"): string | null {
  const slotType = slot === "a" ? bout.slot_a_type : bout.slot_b_type;
  const fighter = slot === "a" ? bout.fighter_a : bout.fighter_b;

  if (slotType === "bye" || slotType === "winner_of" || !fighter) return null;
  return getFighterClubDisplayName(fighter);
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
}: {
  bout: Bout;
  slot: "a" | "b";
  fighters: Fighter[];
  bouts: Bout[];
  canEdit: boolean;
  onAssign: (boutId: string, slot: "a" | "b", fighterId: string | null) => Promise<void>;
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

  const displayName = slotDisplayName(bout, slot, bouts);
  const clubName = slotClubName(bout, slot);

  return (
    <div className="bracket-fixture-row">
      <div className={nameClass}>
        {editable ? (
          <select
            className="bracket-fixture-select"
            value={fighterId ?? ""}
            disabled={saving}
            onChange={(e) => handleChange(e.target.value)}
            title={clubName ? `${displayName} · ${clubName}` : displayName}
          >
            <option value="">Select fighter…</option>
            {options.map((f) => (
              <option key={f.id} value={f.id}>
                {formatFighterWithClub(f)} ({fighterRecord(f)})
              </option>
            ))}
          </select>
        ) : (
          <span
            className="bracket-fixture-name-text bracket-fixture-name-print"
            title={clubName ? `${displayName} · ${clubName}` : displayName}
          >
            <span className="block truncate">{displayName}</span>
            {clubName ? (
              <span className="block truncate text-[11px] text-gray-500">{clubName}</span>
            ) : null}
          </span>
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
}) {
  const canEnterResult = canRecord && bout.status === "scheduled";

  return (
    <div className="bracket-fixture">
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
        />
      </div>
      {canEnterResult && (
        <div className="bracket-fixture-actions no-print">
          <button
            type="button"
            onClick={onRecord}
            className="text-xs font-medium text-boxing hover:underline"
          >
            Enter result →
          </button>
        </div>
      )}
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
  const [bracketName, setBracketName] = useState(bracket.name);
  const [savingName, setSavingName] = useState(false);
  const { isPending, start, end } = usePendingLoads();

  useEffect(() => {
    setBouts(initialBouts);
  }, [initialBouts]);

  useEffect(() => {
    setBracketName(bracket.name);
  }, [bracket.name]);

  const { rounds } = useMemo(() => organizeBoutsByRound(bouts), [bouts]);

  const treeMinHeight = useMemo(() => {
    const firstRoundCount = rounds[0]?.bouts.length ?? 1;
    return Math.max(180, firstRoundCount * 110);
  }, [rounds]);

  const handleAssign = useCallback(
    async (boutId: string, slot: "a" | "b", fighterId: string | null) => {
      const nextBouts = applyFighterAssignment(bouts, fighters, boutId, slot, fighterId);
      setBouts(nextBouts);

      if (isDemo) return;

      start();
      try {
        await reassignBracketFighter(supabase, bracket.id, boutId, slot, fighterId);
        router.refresh();
      } catch {
        setBouts(bouts);
      } finally {
        end();
      }
    },
    [bouts, bracket.id, end, fighters, isDemo, router, start, supabase]
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

  const tournamentTitle =
    participantCount > 0
      ? `${participantCount} Fighter Single Elimination Tournament`
      : bracketName;

  async function saveBracketName() {
    if (isDemo || !canEdit || bracketName.trim() === bracket.name) return;
    setSavingName(true);
    start();
    try {
      await updateBracket(supabase, bracket.id, { name: bracketName.trim() });
      router.refresh();
    } finally {
      setSavingName(false);
      end();
    }
  }

  return (
    <LoadingOverlay loading={isPending || savingName} label="Updating bracket…">
    <div className="space-y-4">
      <div className="bracket-actions no-print">
        <div className="text-sm text-gray-500 space-y-2">
          {canEdit && (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input-field text-sm max-w-md"
                  value={bracketName}
                  onChange={(e) => setBracketName(e.target.value)}
                  aria-label="Bracket name"
                />
                <button
                  type="button"
                  className="btn-secondary text-sm gap-2"
                  onClick={saveBracketName}
                  disabled={savingName || bracketName.trim() === bracket.name}
                  title="Save bracket name"
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Save name</span>
                </button>
              </div>
              <span>
                {remainingCount} unassigned · {fighters.length} fighters in pool
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-secondary gap-2"
          title="Print bracket"
        >
          <Printer className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Print bracket</span>
        </button>
      </div>

      <div id="bracket-print-area" className="bracket-print-sheet p-4 sm:p-6 md:p-10">
        <div className="text-center mb-10">
          <h1 className="bracket-print-title">{tournamentTitle}</h1>
          {participantCount > 0 && bracketName !== tournamentTitle && (
            <p className="bracket-print-meta mt-3 font-medium text-gray-700 normal-case">
              {bracketName}
            </p>
          )}
          <p className="bracket-print-meta capitalize">
            {bracket.format.replace(/_/g, " ")} · {bracket.status.replace(/_/g, " ")}
            {bracket.scheduled_date ? ` · ${bracket.scheduled_date}` : ""}
          </p>
        </div>

        {rounds.length === 0 ? (
          <p className="text-center text-gray-500">No matches in this bracket yet.</p>
        ) : (
          <>
            <p className="bracket-scroll-hint">Swipe horizontally to view the full bracket →</p>
            <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 touch-pan-x">
            <div className="bracket-tree" style={{ minHeight: treeMinHeight }}>
              {rounds.map((round, roundIndex) => (
                <div
                  key={round.roundNumber}
                  className="bracket-round-col"
                  style={{ minHeight: treeMinHeight }}
                >
                  <p className="bracket-round-header">{round.label}</p>
                  <div
                    className="bracket-round-matches"
                    style={{ minHeight: treeMinHeight - 40 }}
                  >
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
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </>
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
    </LoadingOverlay>
  );
}
