import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classifyAgeCategory,
  classifyWeightClass,
  canImportFighters,
  ageRangeFromBirthYears,
  dobFromBirthYear,
  generateBracketBouts,
  resolveInitialBoutStatus,
  getImportableClubLabel,
  parseBirthYear,
  resolveImportableClub,
  buildDefaultEventCategoryConfig,
  attachPlatformWeightIds,
  parseEventCategoryConfig,
  ensureCompleteEventCategoryConfig,
  buildPlatformCategoryCatalog,
  findPlatformWeightClass,
  categoryResolveCacheKey,
  weightResolveCacheKey,
  type EventCategoryConfig,
  type PlatformCategoryCatalog,
  type BracketInput,
  type BracketListItem,
  type BoutResultInput,
  type EventInput,
  type FighterFormInput,
  type Gender,
  type BracketPreviewBout,
} from "@boutforge/shared";
import type {
  AgeCategory,
  Bout,
  BoutResult,
  Bracket,
  Club,
  ClubFighterParticipation,
  ClubInvite,
  ClubMember,
  ClubParticipationGroup,
  Event,
  Fighter,
  FighterInput,
  Profile,
  WeightClass,
} from "@boutforge/shared";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function getUserClubs(
  supabase: SupabaseClient,
  userId: string
): Promise<ClubMember[]> {
  const { data } = await supabase
    .from("club_members")
    .select("*, club:clubs(*)")
    .eq("user_id", userId);
  return (data ?? []) as ClubMember[];
}

export async function createClub(
  supabase: SupabaseClient,
  name: string,
  stateUnit?: string
): Promise<Club> {
  const { data: club, error } = await supabase.rpc("create_club_with_admin", {
    p_name: name,
    p_state_unit: stateUnit ?? null,
  });
  if (error) throw error;
  if (!club) throw new Error("Failed to create club");

  return club as Club;
}

export async function joinClubWithInvite(
  supabase: SupabaseClient,
  token: string
): Promise<Club> {
  const { data: club, error } = await supabase.rpc("join_club_with_invite", {
    p_token: token.trim(),
  });
  if (error) throw error;
  if (!club) throw new Error("Invalid or expired invite");

  return club as Club;
}

type PendingSignupMetadata = {
  pending_club_name?: string | null;
  pending_invite_token?: string | null;
};

/** Finish club setup stored during signup when email confirmation delayed the session. */
export async function completePendingSignup(
  supabase: SupabaseClient
): Promise<Club | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await getUserClubs(supabase, user.id);
  if (existing.length > 0) {
    return (existing[0].club as Club | undefined) ?? null;
  }

  const meta = user.user_metadata as PendingSignupMetadata;
  const clubName = meta.pending_club_name?.trim();
  const inviteToken = meta.pending_invite_token?.trim();

  let club: Club | null = null;
  if (inviteToken) {
    club = await joinClubWithInvite(supabase, inviteToken);
  } else if (clubName) {
    club = await createClub(supabase, clubName);
  } else {
    return null;
  }

  await supabase.auth.updateUser({
    data: {
      pending_club_name: null,
      pending_invite_token: null,
    },
  });

  return club;
}

/** Run pending signup work and return where the user should go next. */
export async function resolveAuthDestination(
  supabase: SupabaseClient
): Promise<"dashboard" | "onboarding"> {
  await completePendingSignup(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "onboarding";
  const clubs = await getUserClubs(supabase, user.id);
  return clubs.length > 0 ? "dashboard" : "onboarding";
}

export async function createInvite(
  supabase: SupabaseClient,
  clubId: string,
  role: string
): Promise<ClubInvite> {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("club_invites")
    .insert({
      club_id: clubId,
      token,
      role,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ClubInvite;
}

export async function getAgeCategories(
  supabase: SupabaseClient
): Promise<AgeCategory[]> {
  const { data } = await supabase.from("age_categories").select("*").order("min_age");
  return (data ?? []) as AgeCategory[];
}

export async function getWeightClasses(
  supabase: SupabaseClient
): Promise<WeightClass[]> {
  const { data } = await supabase.from("weight_classes").select("*").eq("is_enabled", true);
  return (data ?? []) as WeightClass[];
}

export async function createFixtureAgeCategory(
  supabase: SupabaseClient,
  clubId: string,
  input: {
    name: string;
    birth_year_from: number;
    birth_year_to: number;
    competition_year?: number;
  }
): Promise<AgeCategory> {
  const range = ageRangeFromBirthYears(
    input.birth_year_from,
    input.birth_year_to,
    input.competition_year
  );
  const code = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

  const { data, error } = await supabase
    .from("age_categories")
    .insert({
      name: input.name.trim(),
      code: code || `cat_${Date.now()}`,
      min_age: range.min_age,
      max_age: range.max_age,
      birth_year_from: range.birth_year_from,
      birth_year_to: range.birth_year_to,
      is_custom: true,
      club_id: clubId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AgeCategory;
}

export async function updateFixtureAgeCategory(
  supabase: SupabaseClient,
  categoryId: string,
  input: {
    birth_year_from: number;
    birth_year_to: number;
    competition_year?: number;
  }
): Promise<AgeCategory> {
  const range = ageRangeFromBirthYears(
    input.birth_year_from,
    input.birth_year_to,
    input.competition_year
  );

  const { data, error } = await supabase
    .from("age_categories")
    .update({
      birth_year_from: range.birth_year_from,
      birth_year_to: range.birth_year_to,
      min_age: range.min_age,
      max_age: range.max_age,
    })
    .eq("id", categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as AgeCategory;
}

export async function createFixtureWeightClass(
  supabase: SupabaseClient,
  clubId: string,
  input: {
    name: string;
    gender: Gender;
    age_category_id: string;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  }
): Promise<WeightClass> {
  const { data, error } = await supabase
    .from("weight_classes")
    .insert({
      name: input.name.trim(),
      gender: input.gender,
      age_category_id: input.age_category_id,
      min_weight_kg: input.min_weight_kg,
      max_weight_kg: input.max_weight_kg,
      is_custom: true,
      club_id: clubId,
      is_enabled: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WeightClass;
}

export async function assignFightersToFixtureSection(
  supabase: SupabaseClient,
  fighterIds: string[],
  ageCategoryId: string,
  weightClassId: string
): Promise<void> {
  if (fighterIds.length === 0) return;

  const { error } = await supabase
    .from("fighters")
    .update({
      age_category_id: ageCategoryId,
      weight_class_id: weightClassId,
    })
    .in("id", fighterIds);

  if (error) throw error;
}

export async function getFighters(
  supabase: SupabaseClient,
  clubId: string | string[],
  filters?: { age_category_id?: string; gender?: string; weight_class_id?: string }
): Promise<Fighter[]> {
  const clubIds = Array.isArray(clubId) ? clubId : [clubId];
  if (clubIds.length === 0) return [];

  let query = supabase
    .from("fighters")
    .select(
      "*, age_category:age_categories(*), weight_class:weight_classes(*), club:clubs(id, name)"
    )
    .in("club_id", clubIds)
    .eq("status", "active")
    .order("last_name");

  if (filters?.age_category_id) query = query.eq("age_category_id", filters.age_category_id);
  if (filters?.gender) query = query.eq("gender", filters.gender);
  if (filters?.weight_class_id) query = query.eq("weight_class_id", filters.weight_class_id);

  const { data } = await query;
  return (data ?? []) as Fighter[];
}

function groupOrganizerParticipations(
  participations: ClubFighterParticipation[]
): ClubParticipationGroup[] {
  const homeClubMap = new Map<string, ClubParticipationGroup>();

  for (const entry of participations) {
    const homeClubId = entry.fighter_home_club_id;
    const homeClubName = entry.fighter_home_club?.name ?? "Unknown club";

    if (!homeClubMap.has(homeClubId)) {
      homeClubMap.set(homeClubId, {
        home_club_id: homeClubId,
        home_club_name: homeClubName,
        fighters: [],
      });
    }

    const group = homeClubMap.get(homeClubId)!;
    let fighterSummary = group.fighters.find((f) => f.fighter.id === entry.fighter_id);

    if (!fighterSummary) {
      fighterSummary = {
        fighter: entry.fighter as Fighter,
        wins: 0,
        losses: 0,
        draws: 0,
        nc: 0,
        total_bouts: 0,
        participations: [],
      };
      group.fighters.push(fighterSummary);
    }

    fighterSummary.participations.push(entry);
    fighterSummary.total_bouts += 1;
    if (entry.outcome === "win") fighterSummary.wins += 1;
    if (entry.outcome === "loss") fighterSummary.losses += 1;
    if (entry.outcome === "draw") fighterSummary.draws += 1;
    if (entry.outcome === "nc") fighterSummary.nc += 1;
  }

  return Array.from(homeClubMap.values())
    .map((group) => ({
      ...group,
      fighters: group.fighters.sort((a, b) =>
        a.fighter.last_name.localeCompare(b.fighter.last_name)
      ),
    }))
    .sort((a, b) => a.home_club_name.localeCompare(b.home_club_name));
}

/** Fighters who fought in fixtures organized by this club, grouped by home club. */
export async function getOrganizerParticipations(
  supabase: SupabaseClient,
  organizerClubId: string
): Promise<ClubParticipationGroup[]> {
  const { data, error } = await supabase
    .from("club_fighter_participations")
    .select(
      "*, fighter:fighters(*, age_category:age_categories(*), weight_class:weight_classes(*), club:clubs(id, name)), fighter_home_club:clubs!club_fighter_participations_fighter_home_club_id_fkey(id, name), bracket:brackets(id, name)"
    )
    .eq("organizer_club_id", organizerClubId)
    .order("participated_at", { ascending: false });

  if (error) throw error;
  return groupOrganizerParticipations((data ?? []) as ClubFighterParticipation[]);
}

/** Participation history for one fighter, grouped by organizing club. */
export async function getFighterOrganizerParticipations(
  supabase: SupabaseClient,
  fighterId: string
): Promise<
  Array<{
    organizer_club_id: string;
    organizer_club_name: string;
    wins: number;
    losses: number;
    draws: number;
    nc: number;
    total_bouts: number;
    participations: ClubFighterParticipation[];
  }>
> {
  const { data, error } = await supabase
    .from("club_fighter_participations")
    .select(
      "*, organizer_club:clubs!club_fighter_participations_organizer_club_id_fkey(id, name), bracket:brackets(id, name)"
    )
    .eq("fighter_id", fighterId)
    .order("participated_at", { ascending: false });

  if (error) throw error;

  const byOrganizer = new Map<
    string,
    {
      organizer_club_id: string;
      organizer_club_name: string;
      wins: number;
      losses: number;
      draws: number;
      nc: number;
      total_bouts: number;
      participations: ClubFighterParticipation[];
    }
  >();

  for (const entry of (data ?? []) as ClubFighterParticipation[]) {
    const organizerId = entry.organizer_club_id;
    const organizerName = entry.organizer_club?.name ?? "Unknown club";

    if (!byOrganizer.has(organizerId)) {
      byOrganizer.set(organizerId, {
        organizer_club_id: organizerId,
        organizer_club_name: organizerName,
        wins: 0,
        losses: 0,
        draws: 0,
        nc: 0,
        total_bouts: 0,
        participations: [],
      });
    }

    const summary = byOrganizer.get(organizerId)!;
    summary.participations.push(entry);
    summary.total_bouts += 1;
    if (entry.outcome === "win") summary.wins += 1;
    if (entry.outcome === "loss") summary.losses += 1;
    if (entry.outcome === "draw") summary.draws += 1;
    if (entry.outcome === "nc") summary.nc += 1;
  }

  return Array.from(byOrganizer.values()).sort((a, b) =>
    a.organizer_club_name.localeCompare(b.organizer_club_name)
  );
}

function fighterWritePayload(
  input: Partial<FighterFormInput>
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if (input.first_name !== undefined) updates.first_name = input.first_name;
  if (input.last_name !== undefined) updates.last_name = input.last_name;
  if (input.dob !== undefined) updates.dob = input.dob;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.weight_kg !== undefined) updates.weight_kg = input.weight_kg;
  if (input.notes !== undefined) updates.notes = input.notes ?? null;
  if (input.affiliation_name !== undefined) {
    updates.affiliation_name = input.affiliation_name?.trim() || null;
  }
  if (input.status !== undefined) updates.status = input.status;
  return updates;
}

export async function createFighter(
  supabase: SupabaseClient,
  clubId: string,
  input: FighterFormInput
): Promise<Fighter> {
  const ageCategories = await getAgeCategories(supabase);
  const weightClasses = await getWeightClasses(supabase);

  const ageCategory = classifyAgeCategory(input.dob, ageCategories);
  const weightClass = ageCategory
    ? classifyWeightClass(input.weight_kg, input.gender, ageCategory.id, weightClasses)
    : null;

  const { data, error } = await supabase
    .from("fighters")
    .insert({
      club_id: clubId,
      ...fighterWritePayload(input),
      age_category_id: ageCategory?.id ?? null,
      weight_class_id: weightClass?.id ?? null,
      status: input.status ?? "active",
    })
    .select("*, age_category:age_categories(*), weight_class:weight_classes(*), club:clubs(id, name)")
    .single();
  if (error) throw error;
  return data as Fighter;
}

export async function updateFighter(
  supabase: SupabaseClient,
  fighterId: string,
  input: Partial<FighterFormInput>
): Promise<Fighter> {
  const updates = fighterWritePayload(input);

  if (input.dob || input.weight_kg || input.gender) {
    const ageCategories = await getAgeCategories(supabase);
    const weightClasses = await getWeightClasses(supabase);
    const { data: existing } = await supabase
      .from("fighters")
      .select("*")
      .eq("id", fighterId)
      .single();

    if (existing) {
      const dob = input.dob ?? existing.dob;
      const gender = input.gender ?? existing.gender;
      const weight = input.weight_kg ?? existing.weight_kg;
      const ageCategory = classifyAgeCategory(dob, ageCategories);
      const weightClass = ageCategory
        ? classifyWeightClass(weight, gender, ageCategory.id, weightClasses)
        : null;
      updates.age_category_id = ageCategory?.id ?? null;
      updates.weight_class_id = weightClass?.id ?? null;
    }
  }

  const { data, error } = await supabase
    .from("fighters")
    .update(updates)
    .eq("id", fighterId)
    .select("*, age_category:age_categories(*), weight_class:weight_classes(*)")
    .single();
  if (error) throw error;
  return data as Fighter;
}

export async function deleteFighter(
  supabase: SupabaseClient,
  fighterId: string
): Promise<void> {
  const { error } = await supabase.from("fighters").delete().eq("id", fighterId);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "This fighter cannot be deleted because they are linked to bouts or fixtures."
      );
    }
    throw error;
  }
}

export async function getFighterHistory(
  supabase: SupabaseClient,
  fighterId: string
): Promise<Bout[]> {
  const { data } = await supabase
    .from("bouts")
    .select("*, fighter_a:fighters!bouts_fighter_a_id_fkey(*), fighter_b:fighters!bouts_fighter_b_id_fkey(*), result:bout_results(*)")
    .or(`fighter_a_id.eq.${fighterId},fighter_b_id.eq.${fighterId}`)
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  return (data ?? []) as Bout[];
}

type BoutSeedRow = {
  round_number: number;
  bout_order: number;
  fighter_a_id: string | null;
  fighter_b_id: string | null;
  slot_a_type: string;
  slot_b_type: string;
};

export function extractBracketFighterIds(
  bouts: BoutSeedRow[],
  byeFighterId?: string | null
): string[] {
  const sorted = [...bouts].sort(
    (a, b) => a.round_number - b.round_number || a.bout_order - b.bout_order
  );
  const order: string[] = [];
  const seen = new Set<string>();

  const add = (fighterId: string | null | undefined) => {
    if (!fighterId || seen.has(fighterId)) return;
    seen.add(fighterId);
    order.push(fighterId);
  };

  for (const bout of sorted) {
    if (bout.slot_a_type === "fighter") add(bout.fighter_a_id);
    if (bout.slot_b_type === "fighter") add(bout.fighter_b_id);
  }

  add(byeFighterId);
  return order;
}

function orderFightersByIds(fighters: Fighter[], fighterIds: string[]): Fighter[] {
  const fighterMap = new Map(fighters.map((fighter) => [fighter.id, fighter]));
  return fighterIds
    .map((id) => fighterMap.get(id))
    .filter((fighter): fighter is Fighter => Boolean(fighter));
}

function toFighterInputs(fighters: Fighter[]): FighterInput[] {
  return fighters.map((fighter) => ({
    id: fighter.id,
    first_name: fighter.first_name,
    last_name: fighter.last_name,
    dob: fighter.dob,
    gender: fighter.gender,
    weight_kg: fighter.weight_kg,
    wins: fighter.wins,
    losses: fighter.losses,
    draws: fighter.draws,
    last_bout_at: fighter.last_bout_at,
  }));
}

async function insertBracketBoutsFromPreview(
  supabase: SupabaseClient,
  params: {
    bracketId: string;
    eventId: string;
    clubId: string;
    previewBouts: BracketPreviewBout[];
  }
): Promise<Bout[]> {
  const boutIdMap = new Map<number, string>();
  const createdBouts: Bout[] = [];

  for (const preview of params.previewBouts) {
    const status = resolveInitialBoutStatus(preview);
    const { data: bout, error } = await supabase
      .from("bouts")
      .insert({
        bracket_id: params.bracketId,
        event_id: params.eventId,
        club_id: params.clubId,
        fighter_a_id: preview.fighter_a_id,
        fighter_b_id: preview.fighter_b_id,
        round_number: preview.round_number,
        bout_order: preview.bout_order,
        slot_a_type: preview.slot_a_type,
        slot_b_type: preview.slot_b_type,
        status,
      })
      .select()
      .single();
    if (error) throw error;
    boutIdMap.set(preview.bout_order, bout.id);
    createdBouts.push(bout as Bout);
  }

  for (const preview of params.previewBouts) {
    const boutId = boutIdMap.get(preview.bout_order);
    if (!boutId) continue;

    const updates: Record<string, unknown> = {};
    if (preview.winner_advances_to_order) {
      updates.winner_advances_to_bout_id = boutIdMap.get(preview.winner_advances_to_order);
    }
    if (preview.source_bout_a_order) {
      updates.source_bout_a_id = boutIdMap.get(preview.source_bout_a_order);
    }
    if (preview.source_bout_b_order) {
      updates.source_bout_b_id = boutIdMap.get(preview.source_bout_b_order);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("bouts").update(updates).eq("id", boutId);
      if (error) throw error;
    }
  }

  return createdBouts;
}

export type RegenerateBracketResult = {
  bracketId: string;
  bracketName: string;
  fighterCount: number;
  boutCount: number;
  skipped?: boolean;
  reason?: string;
};

export async function regenerateBracketBouts(
  supabase: SupabaseClient,
  bracketId: string,
  options?: { force?: boolean; fighterIds?: string[] }
): Promise<{ bracket: Bracket; bouts: Bout[] }> {
  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .select("*")
    .eq("id", bracketId)
    .single();
  if (bracketError) throw bracketError;

  if (bracket.format !== "progressive_knockout") {
    throw new Error("Only progressive knockout brackets can be regenerated");
  }

  const { data: existingBouts, error: boutError } = await supabase
    .from("bouts")
    .select(
      "id, round_number, bout_order, fighter_a_id, fighter_b_id, slot_a_type, slot_b_type, status"
    )
    .eq("bracket_id", bracketId)
    .order("round_number")
    .order("bout_order");
  if (boutError) throw boutError;

  const hasCompleted = (existingBouts ?? []).some((bout) => bout.status === "completed");
  if (hasCompleted && !options?.force) {
    throw new Error("Cannot regenerate a bracket that has completed bouts");
  }

  const fighterIds =
    options?.fighterIds ??
    extractBracketFighterIds(existingBouts ?? [], bracket.bye_fighter_id);

  if (fighterIds.length < 2) {
    throw new Error("At least 2 fighters are required to regenerate a bracket");
  }

  const { data: fighters, error: fighterError } = await supabase
    .from("fighters")
    .select("*")
    .in("id", fighterIds);
  if (fighterError) throw fighterError;

  const orderedFighters = orderFightersByIds((fighters ?? []) as Fighter[], fighterIds);
  if (orderedFighters.length < 2) {
    throw new Error("Could not load enough fighters to regenerate this bracket");
  }

  const { bouts: previewBouts, byeFighterId } = generateBracketBouts(
    "progressive_knockout",
    toFighterInputs(orderedFighters),
    bracket.bye_fighter_id
  );

  const { error: deleteError } = await supabase
    .from("bouts")
    .delete()
    .eq("bracket_id", bracketId);
  if (deleteError) throw deleteError;

  const { error: updateError } = await supabase
    .from("brackets")
    .update({ bye_fighter_id: byeFighterId })
    .eq("id", bracketId);
  if (updateError) throw updateError;

  const createdBouts = await insertBracketBoutsFromPreview(supabase, {
    bracketId,
    eventId: bracket.event_id,
    clubId: bracket.club_id,
    previewBouts,
  });

  return {
    bracket: { ...(bracket as Bracket), bye_fighter_id: byeFighterId },
    bouts: createdBouts,
  };
}

export async function regenerateAllProgressiveKnockoutBrackets(
  supabase: SupabaseClient,
  options?: { force?: boolean; bracketIds?: string[] }
): Promise<RegenerateBracketResult[]> {
  let query = supabase
    .from("brackets")
    .select("id, name, format, bye_fighter_id")
    .eq("format", "progressive_knockout");

  if (options?.bracketIds?.length) {
    query = query.in("id", options.bracketIds);
  }

  const { data: brackets, error } = await query;
  if (error) throw error;

  const results: RegenerateBracketResult[] = [];

  for (const bracket of brackets ?? []) {
    const { data: existingBouts } = await supabase
      .from("bouts")
      .select(
        "round_number, bout_order, fighter_a_id, fighter_b_id, slot_a_type, slot_b_type, status"
      )
      .eq("bracket_id", bracket.id);

    const completedCount = (existingBouts ?? []).filter(
      (bout) => bout.status === "completed"
    ).length;

    if (completedCount > 0 && !options?.force) {
      results.push({
        bracketId: bracket.id,
        bracketName: bracket.name,
        fighterCount: 0,
        boutCount: 0,
        skipped: true,
        reason: "Has completed bouts",
      });
      continue;
    }

    const fighterIds = extractBracketFighterIds(existingBouts ?? [], bracket.bye_fighter_id);
    if (fighterIds.length < 2) {
      results.push({
        bracketId: bracket.id,
        bracketName: bracket.name,
        fighterCount: fighterIds.length,
        boutCount: 0,
        skipped: true,
        reason: "Fewer than 2 fighters found",
      });
      continue;
    }

    const { bouts } = await regenerateBracketBouts(supabase, bracket.id, {
      force: options?.force,
      fighterIds,
    });

    results.push({
      bracketId: bracket.id,
      bracketName: bracket.name,
      fighterCount: fighterIds.length,
      boutCount: bouts.length,
    });
  }

  return results;
}

export async function createBracket(
  supabase: SupabaseClient,
  clubId: string,
  input: BracketInput
): Promise<{ bracket: Bracket; bouts: Bout[] }> {
  if (!input.event_id) {
    throw new Error("Every fixture must be linked to an event");
  }

  const { data: fighters } = await supabase
    .from("fighters")
    .select("*")
    .in("id", input.fighter_ids);

  if (!fighters || fighters.length < 2) {
    throw new Error("At least 2 fighters required");
  }

  const orderedFighters = orderFightersByIds(fighters as Fighter[], input.fighter_ids);
  const fighterInputs = toFighterInputs(orderedFighters);

  const { bouts: previewBouts, byeFighterId } = generateBracketBouts(
    input.format,
    fighterInputs,
    input.bye_fighter_id
  );

  const firstFighter = orderedFighters[0];
  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .insert({
      club_id: clubId,
      event_id: input.event_id,
      name: input.name,
      format: input.format,
      age_category_id: input.age_category_id ?? firstFighter.age_category_id,
      gender: input.gender ?? firstFighter.gender,
      weight_class_id: input.weight_class_id ?? firstFighter.weight_class_id,
      status: "published",
      venue: input.venue ?? null,
      scheduled_date: input.scheduled_date ?? null,
      bye_fighter_id: byeFighterId,
    })
    .select()
    .single();
  if (bracketError) throw bracketError;

  const createdBouts = await insertBracketBoutsFromPreview(supabase, {
    bracketId: bracket.id,
    eventId: input.event_id,
    clubId,
    previewBouts,
  });

  return { bracket: bracket as Bracket, bouts: createdBouts };
}

export async function getBracketsByEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<BracketListItem[]> {
  const { data } = await supabase
    .from("brackets")
    .select(
      "*, age_category:age_categories(name), weight_class:weight_classes(name, gender), event:events(id, name, date, venue, status)"
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return (data ?? []) as BracketListItem[];
}

export type EventBracketRosterSection = {
  bracketId: string;
  bracketName: string;
  title: string;
  fighters: Fighter[];
};

export async function getEventBracketRosters(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventBracketRosterSection[]> {
  const brackets = await getBracketsByEvent(supabase, eventId);
  if (brackets.length === 0) return [];

  const bracketIds = brackets.map((b) => b.id);

  const [{ data: bouts }, { data: bracketRows }] = await Promise.all([
    supabase
      .from("bouts")
      .select("bracket_id, fighter_a_id, fighter_b_id, slot_a_type, slot_b_type, round_number, bout_order")
      .in("bracket_id", bracketIds)
      .order("round_number")
      .order("bout_order"),
    supabase.from("brackets").select("id, bye_fighter_id").in("id", bracketIds),
  ]);

  const fighterIdsByBracket = new Map<string, Set<string>>();
  for (const bracketId of bracketIds) {
    fighterIdsByBracket.set(bracketId, new Set());
  }

  for (const bracketId of bracketIds) {
    const bracketBouts = (bouts ?? []).filter((bout) => bout.bracket_id === bracketId);
    for (const fighterId of extractBracketFighterIds(
      bracketBouts,
      bracketRows?.find((row) => row.id === bracketId)?.bye_fighter_id
    )) {
      fighterIdsByBracket.get(bracketId)?.add(fighterId);
    }
  }

  const allFighterIds = [
    ...new Set([...fighterIdsByBracket.values()].flatMap((set) => [...set])),
  ];

  const fighterMap = new Map<string, Fighter>();
  if (allFighterIds.length > 0) {
    const { data: fighters } = await supabase
      .from("fighters")
      .select(
        "*, age_category:age_categories(*), weight_class:weight_classes(*), club:clubs(id, name)"
      )
      .in("id", allFighterIds);

    for (const fighter of fighters ?? []) {
      fighterMap.set(fighter.id, fighter as Fighter);
    }
  }

  return brackets.map((bracket) => {
    const ids = fighterIdsByBracket.get(bracket.id) ?? new Set();
    const sectionFighters = [...ids]
      .map((id) => fighterMap.get(id))
      .filter((fighter): fighter is Fighter => Boolean(fighter))
      .sort(
        (a, b) =>
          a.last_name.localeCompare(b.last_name) ||
          a.first_name.localeCompare(b.first_name)
      );

    return {
      bracketId: bracket.id,
      bracketName: bracket.name,
      title: `${bracket.age_category?.name ?? "Category"} · ${
        bracket.gender ?? bracket.weight_class?.gender ?? ""
      } · ${bracket.weight_class?.name ?? "Weight class"}`,
      fighters: sectionFighters,
    };
  });
}

export async function getBrackets(
  supabase: SupabaseClient,
  clubId: string
): Promise<BracketListItem[]> {
  const { data } = await supabase
    .from("brackets")
    .select(
      "*, age_category:age_categories(name), weight_class:weight_classes(name, gender), event:events(id, name, date, venue, status)"
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return (data ?? []) as BracketListItem[];
}

export async function getBracketWithBouts(
  supabase: SupabaseClient,
  bracketId: string
): Promise<{ bracket: Bracket; bouts: Bout[] }> {
  const { data: bracket } = await supabase
    .from("brackets")
    .select("*")
    .eq("id", bracketId)
    .single();

  const { data: bouts } = await supabase
    .from("bouts")
    .select(
      "*, fighter_a:fighters!bouts_fighter_a_id_fkey(*, club:clubs(id, name)), fighter_b:fighters!bouts_fighter_b_id_fkey(*, club:clubs(id, name)), result:bout_results(*)"
    )
    .eq("bracket_id", bracketId)
    .order("round_number")
    .order("bout_order");

  return {
    bracket: bracket as Bracket,
    bouts: (bouts ?? []).map((row) => normalizeBoutEmbeds(row as Record<string, unknown>)),
  };
}

export async function recordBoutResult(
  supabase: SupabaseClient,
  boutId: string,
  input: BoutResultInput
): Promise<void> {
  const { error } = await supabase.rpc("record_bout_result", {
    p_bout_id: boutId,
    p_winner_id: input.winner_id,
    p_method: input.method,
    p_round_ended: input.round_ended,
    p_scorecards: input.scorecards ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
}

export async function updateBoutFighter(
  supabase: SupabaseClient,
  boutId: string,
  slot: "a" | "b",
  fighterId: string | null
): Promise<void> {
  const updates: Record<string, unknown> =
    slot === "a"
      ? {
          fighter_a_id: fighterId,
          slot_a_type: fighterId ? "fighter" : "tbd",
        }
      : {
          fighter_b_id: fighterId,
          slot_b_type: fighterId ? "fighter" : "tbd",
        };

  const { data: bout, error: fetchError } = await supabase
    .from("bouts")
    .select("fighter_a_id, fighter_b_id, slot_a_type, slot_b_type, status")
    .eq("id", boutId)
    .single();
  if (fetchError) throw fetchError;

  const nextA = slot === "a" ? fighterId : bout.fighter_a_id;
  const nextB = slot === "b" ? fighterId : bout.fighter_b_id;
  const nextSlotA = slot === "a" ? updates.slot_a_type : bout.slot_a_type;
  const nextSlotB = slot === "b" ? updates.slot_b_type : bout.slot_b_type;

  if (
    nextA &&
    (nextB || nextSlotB === "bye") &&
    nextSlotA === "fighter" &&
    (nextSlotB === "fighter" || nextSlotB === "bye")
  ) {
    updates.status = "scheduled";
  }

  const { error } = await supabase.from("bouts").update(updates).eq("id", boutId);
  if (error) throw error;
}

export async function reassignBracketFighter(
  supabase: SupabaseClient,
  bracketId: string,
  boutId: string,
  slot: "a" | "b",
  fighterId: string | null
): Promise<void> {
  const { data: bouts, error: listError } = await supabase
    .from("bouts")
    .select("id, round_number, fighter_a_id, fighter_b_id, slot_a_type, slot_b_type, status")
    .eq("bracket_id", bracketId);
  if (listError) throw listError;
  if (!bouts?.length) throw new Error("Bracket not found");

  const isPoolSlot = (
    bout: (typeof bouts)[number],
    s: "a" | "b"
  ): boolean => {
    const slotType = s === "a" ? bout.slot_a_type : bout.slot_b_type;
    if (slotType === "winner_of" || slotType === "tbd") return false;
    return slotType === "fighter" || slotType === "bye";
  };

  const clearUpdates: Array<{ id: string; slot: "a" | "b" }> = [];

  if (fighterId) {
    for (const bout of bouts) {
      if (bout.id === boutId) continue;
      if (bout.status === "completed") continue;
      if (bout.fighter_a_id === fighterId && isPoolSlot(bout, "a")) {
        clearUpdates.push({ id: bout.id, slot: "a" });
      }
      if (bout.fighter_b_id === fighterId && isPoolSlot(bout, "b")) {
        clearUpdates.push({ id: bout.id, slot: "b" });
      }
    }
  }

  for (const { id, slot: clearSlot } of clearUpdates) {
    await updateBoutFighter(supabase, id, clearSlot, null);
  }

  await updateBoutFighter(supabase, boutId, slot, fighterId);
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  input: { full_name: string }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name.trim() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getEventCategoryConfig(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventCategoryConfig | null> {
  const { data } = await supabase
    .from("events")
    .select("category_config, competition_year, date")
    .eq("id", eventId)
    .single();

  if (!data) return null;

  const competitionYear =
    data.competition_year ??
    (data.date ? new Date(data.date).getFullYear() : new Date().getFullYear());
  const [categories, weights] = await Promise.all([
    getAgeCategories(supabase),
    getWeightClasses(supabase),
  ]);

  const parsed = parseEventCategoryConfig(data.category_config);
  if (parsed) {
    return ensureCompleteEventCategoryConfig(parsed, categories, weights);
  }

  return attachPlatformWeightIds(
    buildDefaultEventCategoryConfig(competitionYear, categories),
    categories,
    weights
  );
}

export async function saveEventCategoryConfig(
  supabase: SupabaseClient,
  eventId: string,
  config: EventCategoryConfig
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .update({
      category_config: config,
      competition_year: config.competition_year,
    })
    .eq("id", eventId)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function updateBracket(
  supabase: SupabaseClient,
  bracketId: string,
  input: {
    name?: string;
    status?: Event["status"];
    scheduled_date?: string | null;
    venue?: string | null;
  }
): Promise<Bracket> {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.status !== undefined) updates.status = input.status;
  if (input.scheduled_date !== undefined) updates.scheduled_date = input.scheduled_date;
  if (input.venue !== undefined) updates.venue = input.venue;

  const { data, error } = await supabase
    .from("brackets")
    .update(updates)
    .eq("id", bracketId)
    .select()
    .single();
  if (error) throw error;
  return data as Bracket;
}

export async function deleteBracket(
  supabase: SupabaseClient,
  bracketId: string
): Promise<void> {
  const { error } = await supabase.from("brackets").delete().eq("id", bracketId);
  if (error) throw error;
}

export async function resolveFixtureCategoryIds(
  supabase: SupabaseClient,
  clubId: string,
  input: {
    competitionYear: number;
    category: {
      sourceId: string | null;
      code?: string;
      name: string;
      birth_year_from: number;
      birth_year_to: number;
      isDefault: boolean;
    };
    weightClass: {
      name: string;
      gender: Gender;
      min_weight_kg: number | null;
      max_weight_kg: number | null;
    };
  },
  catalog?: PlatformCategoryCatalog
): Promise<{ ageCategoryId: string; weightClassId: string }> {
  if (!catalog) {
    const [platformCategories, platformWeights] = await Promise.all([
      getAgeCategories(supabase),
      getWeightClasses(supabase),
    ]);
    catalog = buildPlatformCategoryCatalog(platformCategories, platformWeights);
  }

  return resolveFixtureCategoryIdsWithCatalog(
    supabase,
    clubId,
    input.competitionYear,
    input,
    catalog
  );
}

export type FixtureSectionResolveInput = {
  sectionKey: string;
  category: {
    sourceId: string | null;
    code?: string;
    name: string;
    birth_year_from: number;
    birth_year_to: number;
    isDefault: boolean;
  };
  weightClass: {
    name: string;
    gender: Gender;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  };
};

export async function resolveFixtureCategoryIdsBatch(
  supabase: SupabaseClient,
  clubId: string,
  competitionYear: number,
  sections: FixtureSectionResolveInput[]
): Promise<Map<string, { ageCategoryId: string; weightClassId: string }>> {
  const [platformCategories, platformWeights] = await Promise.all([
    getAgeCategories(supabase),
    getWeightClasses(supabase),
  ]);
  const catalog = buildPlatformCategoryCatalog(platformCategories, platformWeights);
  const categoryCache = new Map<string, string>();
  const weightCache = new Map<string, string>();
  const results = new Map<string, { ageCategoryId: string; weightClassId: string }>();

  for (const section of sections) {
    const categoryKey = categoryResolveCacheKey(section.category);
    let ageCategoryId = categoryCache.get(categoryKey);

    if (!ageCategoryId) {
      const resolved = await resolveFixtureCategoryIdsWithCatalog(
        supabase,
        clubId,
        competitionYear,
        section,
        catalog
      );
      ageCategoryId = resolved.ageCategoryId;
      categoryCache.set(categoryKey, ageCategoryId);
      weightCache.set(
        weightResolveCacheKey(ageCategoryId, section.weightClass),
        resolved.weightClassId
      );
      results.set(section.sectionKey, resolved);
      continue;
    }

    const weightKey = weightResolveCacheKey(ageCategoryId, section.weightClass);
    let weightClassId = weightCache.get(weightKey);
    if (!weightClassId) {
      const resolved = await resolveFixtureCategoryIdsWithCatalog(
        supabase,
        clubId,
        competitionYear,
        section,
        catalog,
        ageCategoryId
      );
      weightClassId = resolved.weightClassId;
      weightCache.set(weightKey, weightClassId);
    }

    results.set(section.sectionKey, { ageCategoryId, weightClassId });
  }

  return results;
}

async function resolveFixtureCategoryIdsWithCatalog(
  supabase: SupabaseClient,
  clubId: string,
  competitionYear: number,
  input: {
    category: FixtureSectionResolveInput["category"];
    weightClass: FixtureSectionResolveInput["weightClass"];
  },
  catalog: PlatformCategoryCatalog,
  knownAgeCategoryId?: string
): Promise<{ ageCategoryId: string; weightClassId: string }> {
  let ageCategoryId = knownAgeCategoryId;

  if (!ageCategoryId) {
    ageCategoryId = input.category.sourceId ?? undefined;

    if (ageCategoryId) {
      const existing = catalog.categoryById.get(ageCategoryId);
      if (existing?.club_id === null && input.category.isDefault) {
        ageCategoryId = existing.id;
      } else if (existing?.is_custom) {
        await updateFixtureAgeCategory(supabase, ageCategoryId, {
          birth_year_from: input.category.birth_year_from,
          birth_year_to: input.category.birth_year_to,
          competition_year: competitionYear,
        });
      }
    }

    if (!ageCategoryId) {
      const created = await createFixtureAgeCategory(supabase, clubId, {
        name: input.category.name,
        birth_year_from: input.category.birth_year_from,
        birth_year_to: input.category.birth_year_to,
        competition_year: competitionYear,
      });
      ageCategoryId = created.id;
      catalog.categoryById.set(created.id, created);
    }
  }

  const categoryCode =
    input.category.code ??
    catalog.categoryById.get(ageCategoryId)?.code ??
    "";

  const platformMatch = categoryCode
    ? findPlatformWeightClass(catalog, {
        categoryCode,
        gender: input.weightClass.gender,
        min_weight_kg: input.weightClass.min_weight_kg,
        max_weight_kg: input.weightClass.max_weight_kg,
      })
    : undefined;

  let weightClassId = platformMatch?.id;

  if (!weightClassId) {
    const created = await createFixtureWeightClass(supabase, clubId, {
      name: input.weightClass.name,
      gender: input.weightClass.gender,
      age_category_id: ageCategoryId,
      min_weight_kg: input.weightClass.min_weight_kg,
      max_weight_kg: input.weightClass.max_weight_kg,
    });
    weightClassId = created.id;
  }

  return { ageCategoryId, weightClassId };
}

export async function createEvent(
  supabase: SupabaseClient,
  input: EventInput,
  clubIds: string[],
  organizerClubId?: string
): Promise<Event> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const competitionYear = input.date
    ? new Date(input.date).getFullYear()
    : new Date().getFullYear();
  const [platformCategories, platformWeights] = await Promise.all([
    getAgeCategories(supabase),
    getWeightClasses(supabase),
  ]);
  const categoryConfig = attachPlatformWeightIds(
    buildDefaultEventCategoryConfig(competitionYear, platformCategories),
    platformCategories,
    platformWeights
  );

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: input.name,
      date: input.date,
      venue: input.venue ?? null,
      state_zone: input.state_zone ?? null,
      is_cross_club: input.is_cross_club,
      organizer_club_id: organizerClubId ?? clubIds[0] ?? null,
      organizer_user_id: user.id,
      status: "draft",
      competition_year: competitionYear,
      category_config: categoryConfig,
    })
    .select()
    .single();
  if (error) throw error;

  if (clubIds.length > 0) {
    await supabase.from("event_clubs").insert(
      clubIds.map((clubId) => ({ event_id: event.id, club_id: clubId }))
    );
  }

  return event as Event;
}

export async function getEvents(supabase: SupabaseClient): Promise<Event[]> {
  const { data } = await supabase
    .from("events")
    .select("*, event_clubs(*, club:clubs(*))")
    .order("date", { ascending: false });
  return (data ?? []) as Event[];
}

export async function publishEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ status: "published" })
    .eq("id", eventId);
  if (error) throw error;
}

export async function updateEvent(
  supabase: SupabaseClient,
  eventId: string,
  input: EventInput,
  clubIds?: string[]
): Promise<Event> {
  const competitionYear = input.date ? new Date(input.date).getFullYear() : null;
  const { data, error } = await supabase
    .from("events")
    .update({
      name: input.name.trim(),
      date: input.date,
      venue: input.venue?.trim() || null,
      state_zone: input.state_zone?.trim() || null,
      is_cross_club: input.is_cross_club,
      ...(competitionYear ? { competition_year: competitionYear } : {}),
    })
    .eq("id", eventId)
    .select("*, event_clubs(*, club:clubs(*))")
    .single();
  if (error) throw error;

  if (clubIds !== undefined) {
    const { error: deleteError } = await supabase
      .from("event_clubs")
      .delete()
      .eq("event_id", eventId);
    if (deleteError) throw deleteError;

    if (clubIds.length > 0) {
      const { error: insertError } = await supabase.from("event_clubs").insert(
        clubIds.map((clubId) => ({ event_id: eventId, club_id: clubId }))
      );
      if (insertError) throw insertError;
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from("events")
      .select("*, event_clubs(*, club:clubs(*))")
      .eq("id", eventId)
      .single();
    if (refreshError) throw refreshError;
    return refreshed as Event;
  }

  return data as Event;
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function getAllClubs(supabase: SupabaseClient): Promise<Club[]> {
  const { data } = await supabase.from("clubs").select("*").order("name");
  return (data ?? []) as Club[];
}

export async function importFightersFromCSV(
  supabase: SupabaseClient,
  defaultClubId: string,
  rows: Array<{
    name: string;
    birth_year: number;
    gender: string;
    weight_kg: number;
    club_name?: string;
  }>,
  memberships: ClubMember[]
): Promise<{
  imported: number;
  errors: string[];
  clubCounts: Array<{ club_id: string; club_name: string; count: number }>;
}> {
  const ageCategories = await getAgeCategories(supabase);
  const weightClasses = await getWeightClasses(supabase);
  const errors: string[] = [];
  let imported = 0;
  const countByClub = new Map<string, { club_name: string; count: number }>();

  const importableClubs = memberships.filter((entry) =>
    canImportFighters(entry.role)
  );

  function resolveClubTarget(
    rowIndex: number,
    clubName?: string
  ): { clubId: string; affiliationName: string | null } | null {
    const normalized = clubName?.trim();

    const defaultClub = importableClubs.find(
      (entry) => entry.club_id === defaultClubId
    );
    if (!defaultClub) {
      errors.push(
        `Row ${rowIndex + 1}: Default club is not importable`
      );
      return null;
    }

    if (!normalized) {
      return { clubId: defaultClub.club_id, affiliationName: null };
    }

    const match = resolveImportableClub(importableClubs, normalized);
    if (match) {
      return { clubId: match.club_id, affiliationName: null };
    }

    return {
      clubId: defaultClub.club_id,
      affiliationName: normalized,
    };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const target = resolveClubTarget(i, row.club_name);
    if (!target) continue;

    const { clubId: targetClubId, affiliationName } = target;

    const parts = row.name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;
    const gender = row.gender.trim().toLowerCase();

    if (!firstName || !gender || !row.weight_kg) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      continue;
    }

    const birthYear = parseBirthYear(row.birth_year);
    if (birthYear === null) {
      errors.push(
        `Row ${i + 1}: birth_year must be a whole year between 1900 and ${new Date().getFullYear()}`
      );
      continue;
    }

    const dob = dobFromBirthYear(birthYear);

    if (gender !== "male" && gender !== "female") {
      errors.push(`Row ${i + 1}: Gender must be male or female`);
      continue;
    }

    if (!Number.isFinite(row.weight_kg) || row.weight_kg <= 0) {
      errors.push(`Row ${i + 1}: Weight must be a positive number`);
      continue;
    }

    const ageCategory = classifyAgeCategory(dob, ageCategories);
    const weightClass = ageCategory
      ? classifyWeightClass(row.weight_kg, gender, ageCategory.id, weightClasses)
      : null;

    const { error } = await supabase.from("fighters").insert({
      club_id: targetClubId,
      first_name: firstName,
      last_name: lastName,
      dob,
      gender,
      weight_kg: row.weight_kg,
      age_category_id: ageCategory?.id ?? null,
      weight_class_id: weightClass?.id ?? null,
      affiliation_name: affiliationName,
    });

    if (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
    } else {
      imported++;
      const clubName =
        affiliationName ??
        getImportableClubLabel(
          importableClubs.find((entry) => entry.club_id === targetClubId) ?? {
            club_id: targetClubId,
          }
        );
      const existing = countByClub.get(targetClubId);
      if (existing) {
        existing.count += 1;
      } else {
        countByClub.set(targetClubId, { club_name: clubName, count: 1 });
      }
    }
  }

  return {
    imported,
    errors,
    clubCounts: Array.from(countByClub.entries()).map(([club_id, value]) => ({
      club_id,
      club_name: value.club_name,
      count: value.count,
    })),
  };
}

function normalizeBoutEmbeds(row: Record<string, unknown>): Bout {
  const rawResult = row.result;
  const result = Array.isArray(rawResult)
    ? ((rawResult[0] as BoutResult | undefined) ?? null)
    : ((rawResult as BoutResult | null | undefined) ?? null);

  return { ...row, result } as Bout;
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  clubId: string
) {
  const [fighters, bouts, brackets] = await Promise.all([
    supabase.from("fighters").select("id", { count: "exact" }).eq("club_id", clubId).eq("status", "active"),
    supabase.from("bouts").select("id", { count: "exact" }).eq("club_id", clubId).eq("status", "scheduled"),
    supabase.from("brackets").select("id", { count: "exact" }).eq("club_id", clubId).in("status", ["published", "in_progress"]),
  ]);

  const { data: recentResults } = await supabase
    .from("bouts")
    .select("*, fighter_a:fighters!bouts_fighter_a_id_fkey(*), fighter_b:fighters!bouts_fighter_b_id_fkey(*), result:bout_results(*)")
    .eq("club_id", clubId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: upcomingBouts } = await supabase
    .from("bouts")
    .select("*, fighter_a:fighters!bouts_fighter_a_id_fkey(*), fighter_b:fighters!bouts_fighter_b_id_fkey(*)")
    .eq("club_id", clubId)
    .eq("status", "scheduled")
    .order("scheduled_at")
    .limit(5);

  return {
    fighterCount: fighters.count ?? 0,
    upcomingCount: bouts.count ?? 0,
    activeBrackets: brackets.count ?? 0,
    recentResults: (recentResults ?? []).map((row) => normalizeBoutEmbeds(row as Record<string, unknown>)),
    upcomingBouts: (upcomingBouts ?? []).map((row) => normalizeBoutEmbeds(row as Record<string, unknown>)),
  };
}
