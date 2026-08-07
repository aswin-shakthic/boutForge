export type UserRole =
  | "platform_admin"
  | "matchmaker"
  | "club_admin"
  | "coach"
  | "viewer";

export type Gender = "male" | "female";

export type BoutStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "pending_fighters";

export type FixtureFormat =
  | "progressive_knockout"
  | "round_robin"
  | "manual";

export type EventStatus = "draft" | "published" | "in_progress" | "completed";

export type BoutMethod =
  | "KO"
  | "TKO"
  | "UD"
  | "SD"
  | "MD"
  | "DQ"
  | "RSC"
  | "NC"
  | "DRAW";

export type BracketSlotType =
  | "fighter"
  | "bye"
  | "winner_of"
  | "tbd";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_platform_admin: boolean;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  state_unit: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  club?: Club;
  profile?: Profile;
}

export interface AgeCategory {
  id: string;
  name: string;
  code: string;
  min_age: number;
  max_age: number;
  birth_year_from: number | null;
  birth_year_to: number | null;
  is_custom: boolean;
  club_id: string | null;
}

export interface WeightClass {
  id: string;
  name: string;
  gender: Gender;
  age_category_id: string;
  min_weight_kg: number | null;
  max_weight_kg: number | null;
  is_custom: boolean;
  club_id: string | null;
  is_enabled: boolean;
}

export interface Fighter {
  id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: Gender;
  weight_kg: number;
  age_category_id: string | null;
  weight_class_id: string | null;
  wins: number;
  losses: number;
  draws: number;
  notes: string | null;
  affiliation_name: string | null;
  status: "active" | "inactive";
  created_at: string;
  age_category?: AgeCategory;
  weight_class?: WeightClass;
  club?: Pick<Club, "id" | "name">;
  last_bout_at?: string | null;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string | null;
  state_zone: string | null;
  status: EventStatus;
  is_cross_club: boolean;
  organizer_club_id: string | null;
  organizer_user_id: string | null;
  created_at: string;
}

export interface EventClub {
  id: string;
  event_id: string;
  club_id: string;
  club?: Club;
}

export interface Bracket {
  id: string;
  club_id: string;
  event_id: string;
  name: string;
  format: FixtureFormat;
  age_category_id: string | null;
  gender: Gender | null;
  weight_class_id: string | null;
  status: EventStatus;
  venue: string | null;
  scheduled_date: string | null;
  bye_fighter_id: string | null;
  created_at: string;
}

export interface Bout {
  id: string;
  bracket_id: string | null;
  event_id: string | null;
  club_id: string;
  fighter_a_id: string | null;
  fighter_b_id: string | null;
  round_number: number;
  bout_order: number;
  winner_advances_to_bout_id: string | null;
  source_bout_a_id: string | null;
  source_bout_b_id: string | null;
  slot_a_type: BracketSlotType;
  slot_b_type: BracketSlotType;
  status: BoutStatus;
  scheduled_at: string | null;
  created_at: string;
  fighter_a?: Fighter | null;
  fighter_b?: Fighter | null;
  result?: BoutResult | null;
}

export interface BoutResult {
  id: string;
  bout_id: string;
  winner_id: string | null;
  method: BoutMethod;
  round_ended: number | null;
  scorecards: Record<string, unknown> | null;
  notes: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export type ParticipationOutcome = "win" | "loss" | "draw" | "nc";

export interface ClubFighterParticipation {
  id: string;
  organizer_club_id: string;
  fighter_id: string;
  fighter_home_club_id: string;
  bout_id: string;
  bracket_id: string | null;
  outcome: ParticipationOutcome;
  method: BoutMethod | null;
  round_ended: number | null;
  participated_at: string;
  fighter?: Fighter;
  fighter_home_club?: Pick<Club, "id" | "name">;
  organizer_club?: Pick<Club, "id" | "name">;
  bracket?: Pick<Bracket, "id" | "name">;
}

export interface ClubParticipationGroup {
  home_club_id: string;
  home_club_name: string;
  fighters: ClubParticipationFighterSummary[];
}

export interface ClubParticipationFighterSummary {
  fighter: Fighter;
  wins: number;
  losses: number;
  draws: number;
  nc: number;
  total_bouts: number;
  participations: ClubFighterParticipation[];
}

export interface ClubInvite {
  id: string;
  club_id: string;
  token: string;
  role: UserRole;
  expires_at: string;
  created_by: string;
  used_at: string | null;
  club?: Club;
}

export interface CategoryOverride {
  id: string;
  club_id: string;
  weight_class_id: string;
  display_label: string | null;
  is_enabled: boolean;
}

export interface BracketPreviewBout {
  round_number: number;
  bout_order: number;
  fighter_a_id: string | null;
  fighter_b_id: string | null;
  slot_a_type: BracketSlotType;
  slot_b_type: BracketSlotType;
  source_bout_a_order: number | null;
  source_bout_b_order: number | null;
  winner_advances_to_order: number | null;
  label: string;
}

export interface FighterInput {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: Gender;
  weight_kg: number;
  wins: number;
  losses: number;
  draws: number;
  last_bout_at?: string | null;
}
