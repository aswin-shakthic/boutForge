import type { SupabaseClient } from "@supabase/supabase-js";
import {
  classifyAgeCategory,
  classifyWeightClass,
  generateBracketBouts,
  type BracketInput,
  type BoutResultInput,
  type EventInput,
  type FighterFormInput,
} from "@boutforge/shared";
import type {
  AgeCategory,
  Bout,
  Bracket,
  Club,
  ClubInvite,
  ClubMember,
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

export async function getFighters(
  supabase: SupabaseClient,
  clubId: string,
  filters?: { age_category_id?: string; gender?: string; weight_class_id?: string }
): Promise<Fighter[]> {
  let query = supabase
    .from("fighters")
    .select("*, age_category:age_categories(*), weight_class:weight_classes(*)")
    .eq("club_id", clubId)
    .eq("status", "active")
    .order("last_name");

  if (filters?.age_category_id) query = query.eq("age_category_id", filters.age_category_id);
  if (filters?.gender) query = query.eq("gender", filters.gender);
  if (filters?.weight_class_id) query = query.eq("weight_class_id", filters.weight_class_id);

  const { data } = await query;
  return (data ?? []) as Fighter[];
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
      first_name: input.first_name,
      last_name: input.last_name,
      dob: input.dob,
      gender: input.gender,
      weight_kg: input.weight_kg,
      age_category_id: ageCategory?.id ?? null,
      weight_class_id: weightClass?.id ?? null,
      notes: input.notes ?? null,
    })
    .select("*, age_category:age_categories(*), weight_class:weight_classes(*)")
    .single();
  if (error) throw error;
  return data as Fighter;
}

export async function updateFighter(
  supabase: SupabaseClient,
  fighterId: string,
  input: Partial<FighterFormInput>
): Promise<Fighter> {
  const updates: Record<string, unknown> = { ...input };

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

export async function createBracket(
  supabase: SupabaseClient,
  clubId: string,
  input: BracketInput
): Promise<{ bracket: Bracket; bouts: Bout[] }> {
  const { data: fighters } = await supabase
    .from("fighters")
    .select("*")
    .in("id", input.fighter_ids);

  if (!fighters || fighters.length < 2) {
    throw new Error("At least 2 fighters required");
  }

  const fighterInputs: FighterInput[] = fighters.map((f) => ({
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
  }));

  const { bouts: previewBouts, byeFighterId } = generateBracketBouts(
    input.format,
    fighterInputs,
    input.bye_fighter_id
  );

  const firstFighter = fighters[0];
  const { data: bracket, error: bracketError } = await supabase
    .from("brackets")
    .insert({
      club_id: clubId,
      name: input.name,
      format: input.format,
      age_category_id: firstFighter.age_category_id,
      gender: firstFighter.gender,
      weight_class_id: firstFighter.weight_class_id,
      status: "published",
      venue: input.venue ?? null,
      scheduled_date: input.scheduled_date ?? null,
      bye_fighter_id: byeFighterId,
    })
    .select()
    .single();
  if (bracketError) throw bracketError;

  const boutIdMap = new Map<number, string>();
  const createdBouts: Bout[] = [];

  for (const preview of previewBouts) {
    const status =
      preview.slot_a_type === "fighter" && preview.slot_b_type === "fighter"
        ? "scheduled"
        : preview.slot_b_type === "bye" && preview.fighter_b_id
          ? "pending_fighters"
          : "pending_fighters";

    const { data: bout, error } = await supabase
      .from("bouts")
      .insert({
        bracket_id: bracket.id,
        club_id: clubId,
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

  for (const preview of previewBouts) {
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
      await supabase.from("bouts").update(updates).eq("id", boutId);
    }
  }

  return { bracket: bracket as Bracket, bouts: createdBouts };
}

export async function getBrackets(
  supabase: SupabaseClient,
  clubId: string
): Promise<Bracket[]> {
  const { data } = await supabase
    .from("brackets")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Bracket[];
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
    .select("*, fighter_a:fighters!bouts_fighter_a_id_fkey(*), fighter_b:fighters!bouts_fighter_b_id_fkey(*), result:bout_results(*)")
    .eq("bracket_id", bracketId)
    .order("round_number")
    .order("bout_order");

  return {
    bracket: bracket as Bracket,
    bouts: (bouts ?? []) as Bout[],
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
    if (slotType === "winner_of") return false;
    if (bout.round_number === 1) return true;
    return slotType === "bye";
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

export async function createEvent(
  supabase: SupabaseClient,
  input: EventInput,
  clubIds: string[]
): Promise<Event> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: input.name,
      date: input.date,
      venue: input.venue ?? null,
      state_zone: input.state_zone ?? null,
      is_cross_club: input.is_cross_club,
      organizer_user_id: user.id,
      status: "draft",
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

export async function getAllClubs(supabase: SupabaseClient): Promise<Club[]> {
  const { data } = await supabase.from("clubs").select("*").order("name");
  return (data ?? []) as Club[];
}

export async function importFightersFromCSV(
  supabase: SupabaseClient,
  clubId: string,
  rows: Array<{ name: string; dob: string; gender: string; weight_kg: number }>
): Promise<{ imported: number; errors: string[] }> {
  const ageCategories = await getAgeCategories(supabase);
  const weightClasses = await getWeightClasses(supabase);
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const parts = row.name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;
    const gender = row.gender.toLowerCase() as "male" | "female";

    if (!firstName || !row.dob || !gender || !row.weight_kg) {
      errors.push(`Row ${i + 1}: Missing required fields`);
      continue;
    }

    const ageCategory = classifyAgeCategory(row.dob, ageCategories);
    const weightClass = ageCategory
      ? classifyWeightClass(row.weight_kg, gender, ageCategory.id, weightClasses)
      : null;

    const { error } = await supabase.from("fighters").insert({
      club_id: clubId,
      first_name: firstName,
      last_name: lastName,
      dob: row.dob,
      gender,
      weight_kg: row.weight_kg,
      age_category_id: ageCategory?.id ?? null,
      weight_class_id: weightClass?.id ?? null,
    });

    if (error) {
      errors.push(`Row ${i + 1}: ${error.message}`);
    } else {
      imported++;
    }
  }

  return { imported, errors };
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
    recentResults: (recentResults ?? []) as Bout[],
    upcomingBouts: (upcomingBouts ?? []) as Bout[],
  };
}
