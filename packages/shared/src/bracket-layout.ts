export const BRACKET_MATCH_HEIGHT = 52;

export type BracketRoundBout = {
  id: string;
  round_number: number;
  bout_order: number;
  source_bout_a_id?: string | null;
  source_bout_b_id?: string | null;
};

export type BracketRoundColumn<T extends BracketRoundBout = BracketRoundBout> = {
  roundNumber: number;
  label: string;
  bouts: T[];
};

export function getRoundShortLabel(
  roundNumber: number,
  maxRound: number,
  boutsInRound: number
): string {
  if (roundNumber === maxRound) return "F";
  if (maxRound >= 3 && roundNumber === maxRound - 1) return "SF";
  if (maxRound >= 4 && roundNumber === maxRound - 2) return "QF";
  if (boutsInRound >= 16) return "R32";
  if (boutsInRound >= 8) return "R16";
  if (boutsInRound >= 4) return "R8";
  return `R${roundNumber}`;
}

export function getMatchGameLabel(roundLabel: string, boutOrder: number): string {
  return `${roundLabel} · Game ${boutOrder}`;
}

export function getBracketMatchMarginTop(
  roundNumber: number,
  indexInRound: number
): number {
  const unit = BRACKET_MATCH_HEIGHT / 2;
  return ((2 * indexInRound + 1) * Math.pow(2, roundNumber - 1) - 1) * unit;
}

export function getBracketTreeHeight(firstRoundCount: number, maxRound: number): number {
  if (firstRoundCount === 0 || maxRound === 0) return BRACKET_MATCH_HEIGHT;
  return firstRoundCount * BRACKET_MATCH_HEIGHT * Math.pow(2, maxRound - 1);
}

export function organizeBoutsByRound<T extends BracketRoundBout>(
  bouts: T[]
): { maxRound: number; rounds: BracketRoundColumn<T>[]; treeHeight: number } {
  if (bouts.length === 0) {
    return { maxRound: 0, rounds: [], treeHeight: BRACKET_MATCH_HEIGHT };
  }

  const maxRound = Math.max(...bouts.map((b) => b.round_number));
  const byRound = new Map<number, T[]>();

  for (const bout of bouts) {
    const list = byRound.get(bout.round_number) ?? [];
    list.push(bout);
    byRound.set(bout.round_number, list);
  }

  const rounds: BracketRoundColumn<T>[] = [];
  for (let roundNumber = 1; roundNumber <= maxRound; roundNumber++) {
    const roundBouts = (byRound.get(roundNumber) ?? []).sort(
      (a, b) => a.bout_order - b.bout_order
    );
    rounds.push({
      roundNumber,
      label: getRoundShortLabel(roundNumber, maxRound, roundBouts.length),
      bouts: roundBouts,
    });
  }

  const firstRoundCount = byRound.get(1)?.length ?? 1;
  const treeHeight = getBracketTreeHeight(firstRoundCount, maxRound);

  return { maxRound, rounds, treeHeight };
}

export type BracketListItem = {
  id: string;
  name: string;
  format: string;
  status: string;
  scheduled_date: string | null;
  created_at: string;
  gender: string | null;
  event_id: string;
  age_category_id: string | null;
  weight_class_id: string | null;
  age_category?: {
    name: string;
    birth_year_from?: number | null;
    birth_year_to?: number | null;
  } | null;
  weight_class?: { name: string; gender?: string | null } | null;
  event?: {
    id: string;
    name: string;
    date: string;
    venue?: string | null;
    status: string;
  } | null;
};

export function formatFixtureBracketName(parts: {
  categoryName: string;
  gender: string;
  weightClassName: string;
  birthYearFrom?: number | null;
  birthYearTo?: number | null;
}): string {
  const base = `${parts.categoryName} ${parts.gender} ${parts.weightClassName}`.trim();
  const from = parts.birthYearFrom;
  const to = parts.birthYearTo;
  if (from != null && to != null) {
    const minYear = Math.min(from, to);
    const maxYear = Math.max(from, to);
    return `${base} (${minYear}/${maxYear})`;
  }
  return base;
}

export function getBracketDisplayName(bracket: BracketListItem): string {
  const categoryName = bracket.age_category?.name;
  const weightName = bracket.weight_class?.name;
  const gender = bracket.gender ?? bracket.weight_class?.gender;

  if (categoryName && weightName && gender) {
    return formatFixtureBracketName({
      categoryName,
      gender,
      weightClassName: weightName,
      birthYearFrom: bracket.age_category?.birth_year_from,
      birthYearTo: bracket.age_category?.birth_year_to,
    });
  }

  return bracket.name;
}

function formatBirthYearRange(
  birthYearFrom?: number | null,
  birthYearTo?: number | null
): string | null {
  if (birthYearFrom == null || birthYearTo == null) return null;
  const minYear = Math.min(birthYearFrom, birthYearTo);
  const maxYear = Math.max(birthYearFrom, birthYearTo);
  return `${minYear}/${maxYear}`;
}

export type BracketDisplayGroup = {
  key: string;
  title: string;
  subtitle: string;
  brackets: BracketListItem[];
};

export type EventBracketGroup = {
  key: string;
  eventId: string;
  title: string;
  subtitle: string;
  eventStatus: string;
  sections: BracketDisplayGroup[];
};

export function groupBracketsForDisplay(brackets: BracketListItem[]): BracketDisplayGroup[] {
  const groups = new Map<string, BracketDisplayGroup>();

  for (const bracket of brackets) {
    const categoryName = bracket.age_category?.name ?? "General";
    const weightName = bracket.weight_class?.name ?? "Open weight";
    const gender = bracket.gender ?? bracket.weight_class?.gender ?? "";
    const birthYears = formatBirthYearRange(
      bracket.age_category?.birth_year_from,
      bracket.age_category?.birth_year_to
    );
    const key = `${categoryName}::${gender}::${weightName}::${birthYears ?? ""}`;

    if (!groups.has(key)) {
      const subtitleParts = [gender, weightName, birthYears ? `(${birthYears})` : null].filter(
        Boolean
      );
      groups.set(key, {
        key,
        title: categoryName,
        subtitle: subtitleParts.join(" · "),
        brackets: [],
      });
    }
    groups.get(key)!.brackets.push(bracket);
  }

  return Array.from(groups.values()).sort((a, b) =>
    `${a.title}${a.subtitle}`.localeCompare(`${b.title}${b.subtitle}`)
  );
}

export function groupBracketsByEvent(brackets: BracketListItem[]): EventBracketGroup[] {
  const byEvent = new Map<string, BracketListItem[]>();

  for (const bracket of brackets) {
    const eventId = bracket.event_id ?? bracket.event?.id ?? "unknown";
    const list = byEvent.get(eventId) ?? [];
    list.push(bracket);
    byEvent.set(eventId, list);
  }

  const eventGroups: EventBracketGroup[] = [];

  for (const [eventId, eventBrackets] of byEvent) {
    const sample = eventBrackets[0];
    const event = sample.event;
    const title = event?.name ?? "Unlinked event";
    const subtitleParts = [
      event?.date,
      event?.venue ?? undefined,
      event?.status ? event.status.replace(/_/g, " ") : undefined,
    ].filter(Boolean);

    eventGroups.push({
      key: eventId,
      eventId,
      title,
      subtitle: subtitleParts.join(" · "),
      eventStatus: event?.status ?? "draft",
      sections: groupBracketsForDisplay(eventBrackets),
    });
  }

  return eventGroups.sort((a, b) => {
    const dateA = a.sections[0]?.brackets[0]?.event?.date ?? "";
    const dateB = b.sections[0]?.brackets[0]?.event?.date ?? "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return a.title.localeCompare(b.title);
  });
}
