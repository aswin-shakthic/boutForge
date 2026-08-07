import type {
  Bout,
  Bracket,
  Club,
  ClubMember,
  Event,
  Fighter,
  Profile,
  WeightClass,
} from "@boutforge/shared";

export const MOCK_CLUB: Club = {
  id: "club-mumbai-warriors",
  name: "Mumbai Warriors Boxing Club",
  state_unit: "Maharashtra",
  settings: {},
  created_at: "2025-01-15T00:00:00Z",
};

export const MOCK_PROFILE: Profile = {
  id: "user-coach-1",
  email: "coach@mumbaiwarriors.in",
  full_name: "Priya Deshmukh",
  is_platform_admin: false,
  created_at: "2025-01-15T00:00:00Z",
};

export const MOCK_MEMBERSHIP: ClubMember = {
  id: "member-1",
  club_id: MOCK_CLUB.id,
  user_id: MOCK_PROFILE.id,
  role: "club_admin",
  created_at: "2025-01-15T00:00:00Z",
  club: MOCK_CLUB,
  profile: MOCK_PROFILE,
};

export const MOCK_ADMIN_MEMBERSHIP: ClubMember = {
  ...MOCK_MEMBERSHIP,
  role: "platform_admin" as ClubMember["role"],
  profile: { ...MOCK_PROFILE, is_platform_admin: true, full_name: "BFI Platform Admin" },
};

const youth = {
  id: "cat-youth",
  name: "Youth",
  code: "youth",
  min_age: 15,
  max_age: 18,
  birth_year_from: null,
  birth_year_to: null,
  is_custom: false,
  club_id: null,
};

const wc60 = {
  id: "wc-60",
  name: "60 kg",
  gender: "male" as const,
  age_category_id: youth.id,
  min_weight_kg: 57.01,
  max_weight_kg: 60,
  is_custom: false,
  club_id: null,
  is_enabled: true,
};

const wc57 = { ...wc60, id: "wc-57", name: "57 kg", min_weight_kg: 54.01, max_weight_kg: 57 };

const elite = {
  id: "cat-elite",
  name: "Elite",
  code: "elite",
  min_age: 19,
  max_age: 40,
  birth_year_from: null,
  birth_year_to: null,
  is_custom: false,
  club_id: null,
};

const wc69 = {
  id: "wc-69",
  name: "69 kg",
  gender: "male" as const,
  age_category_id: elite.id,
  min_weight_kg: 64.01,
  max_weight_kg: 69,
  is_custom: false,
  club_id: null,
  is_enabled: true,
};

function fighter(
  id: string,
  first: string,
  last: string,
  dob: string,
  weight: number,
  wins: number,
  losses: number,
  draws: number,
  ageCat: typeof youth,
  wc: WeightClass,
  lastBout?: string,
  gender: "male" | "female" = "male"
): Fighter {
  return {
    id,
    club_id: MOCK_CLUB.id,
    first_name: first,
    last_name: last,
    dob,
    gender,
    weight_kg: weight,
    age_category_id: ageCat.id,
    weight_class_id: wc.id,
    wins,
    losses,
    draws,
    notes: null,
    affiliation_name: null,
    status: "active",
    last_bout_at: lastBout ?? null,
    created_at: "2025-06-01T00:00:00Z",
    age_category: ageCat,
    weight_class: wc,
  };
}

/** 7 Youth Male 60kg fighters from the plan scenario */
export const MOCK_FIGHTERS_60KG: Fighter[] = [
  fighter("f-rahul", "Rahul", "Sharma", "2008-03-15", 58, 4, 1, 0, youth, wc60, "2026-05-01"),
  fighter("f-amit", "Amit", "Patel", "2009-07-22", 59, 2, 3, 0, youth, wc60, "2026-04-15"),
  fighter("f-vikram", "Vikram", "Singh", "2008-05-10", 60, 3, 2, 0, youth, wc60, "2026-06-01"),
  fighter("f-suresh", "Suresh", "Nair", "2009-01-08", 57, 1, 4, 0, youth, wc60, "2026-03-20"),
  fighter("f-karan", "Karan", "Mehta", "2010-11-03", 58, 0, 0, 0, youth, wc60),
  fighter("f-deepak", "Deepak", "Rao", "2008-09-12", 59, 2, 1, 0, youth, wc60, "2026-05-10"),
  fighter("f-arjun", "Arjun", "Das", "2009-08-25", 60, 3, 0, 1, youth, wc60, "2026-06-28"),
];

export const MOCK_FIGHTERS_EXTRA: Fighter[] = [
  fighter("f-rohan", "Rohan", "Iyer", "2007-04-20", 68, 5, 2, 0, elite, wc69, "2026-05-20"),
  fighter("f-manish", "Manish", "Gupta", "2008-12-01", 56, 1, 2, 0, youth, wc57, "2026-04-01"),
  fighter("f-neha", "Neha", "Kulkarni", "2009-02-14", 52, 3, 1, 0, youth, { ...wc60, id: "wc-52f", name: "52 kg", gender: "female", min_weight_kg: 50.01, max_weight_kg: 52 }, "2026-05-01", "female"),
];

export const MOCK_ALL_FIGHTERS: Fighter[] = [
  ...MOCK_FIGHTERS_60KG,
  ...MOCK_FIGHTERS_EXTRA,
];

export const MOCK_BRACKET: Bracket = {
  id: "bracket-youth-60",
  club_id: MOCK_CLUB.id,
  event_id: null,
  name: "Youth Male 60kg — July Knockout",
  format: "progressive_knockout",
  age_category_id: youth.id,
  gender: "male",
  weight_class_id: wc60.id,
  status: "in_progress",
  venue: "Mumbai Warriors Club Ring",
  scheduled_date: "2026-07-18",
  bye_fighter_id: "f-arjun",
  created_at: "2026-07-10T00:00:00Z",
};

const F = (id: string) => MOCK_FIGHTERS_60KG.find((x) => x.id === id)!;

export const MOCK_BOUTS: Bout[] = [
  {
    id: "bout-1", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: "f-suresh", fighter_b_id: "f-karan", round_number: 1, bout_order: 1,
    winner_advances_to_bout_id: "bout-4", source_bout_a_id: null, source_bout_b_id: null,
    slot_a_type: "fighter", slot_b_type: "fighter", status: "completed",
    scheduled_at: "2026-07-18T10:00:00", created_at: "",
    fighter_a: F("f-suresh"), fighter_b: F("f-karan"),
    result: { id: "r1", bout_id: "bout-1", winner_id: "f-suresh", method: "UD", round_ended: 3, scorecards: null, notes: null, recorded_by: null, recorded_at: "" },
  },
  {
    id: "bout-2", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: "f-amit", fighter_b_id: "f-deepak", round_number: 1, bout_order: 2,
    winner_advances_to_bout_id: "bout-4", source_bout_a_id: null, source_bout_b_id: null,
    slot_a_type: "fighter", slot_b_type: "fighter", status: "completed",
    scheduled_at: "2026-07-18T10:30:00", created_at: "",
    fighter_a: F("f-amit"), fighter_b: F("f-deepak"),
    result: { id: "r2", bout_id: "bout-2", winner_id: "f-deepak", method: "SD", round_ended: 3, scorecards: null, notes: null, recorded_by: null, recorded_at: "" },
  },
  {
    id: "bout-3", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: "f-rahul", fighter_b_id: "f-vikram", round_number: 1, bout_order: 3,
    winner_advances_to_bout_id: "bout-5", source_bout_a_id: null, source_bout_b_id: null,
    slot_a_type: "fighter", slot_b_type: "fighter", status: "completed",
    scheduled_at: "2026-07-18T11:00:00", created_at: "",
    fighter_a: F("f-rahul"), fighter_b: F("f-vikram"),
    result: { id: "r3", bout_id: "bout-3", winner_id: "f-rahul", method: "UD", round_ended: 3, scorecards: null, notes: null, recorded_by: null, recorded_at: "" },
  },
  {
    id: "bout-4", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: "f-suresh", fighter_b_id: "f-deepak", round_number: 2, bout_order: 4,
    winner_advances_to_bout_id: "bout-6", source_bout_a_id: "bout-1", source_bout_b_id: "bout-2",
    slot_a_type: "fighter", slot_b_type: "fighter", status: "scheduled",
    scheduled_at: "2026-07-18T14:00:00", created_at: "",
    fighter_a: F("f-suresh"), fighter_b: F("f-deepak"),
  },
  {
    id: "bout-5", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: "f-rahul", fighter_b_id: "f-arjun", round_number: 2, bout_order: 5,
    winner_advances_to_bout_id: "bout-6", source_bout_a_id: "bout-3", source_bout_b_id: null,
    slot_a_type: "fighter", slot_b_type: "bye", status: "scheduled",
    scheduled_at: "2026-07-18T14:30:00", created_at: "",
    fighter_a: F("f-rahul"), fighter_b: F("f-arjun"),
  },
  {
    id: "bout-6", bracket_id: MOCK_BRACKET.id, event_id: null, club_id: MOCK_CLUB.id,
    fighter_a_id: null, fighter_b_id: null, round_number: 3, bout_order: 6,
    winner_advances_to_bout_id: null, source_bout_a_id: "bout-4", source_bout_b_id: "bout-5",
    slot_a_type: "winner_of", slot_b_type: "winner_of", status: "pending_fighters",
    scheduled_at: "2026-07-18T16:00:00", created_at: "",
  },
];

export const MOCK_BRACKETS: Bracket[] = [
  MOCK_BRACKET,
  {
    ...MOCK_BRACKET,
    id: "bracket-elite-69",
    name: "Elite Male 69kg — Sparring Day",
    status: "published",
    scheduled_date: "2026-08-05",
    format: "round_robin",
    bye_fighter_id: null,
  },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: "event-west-zone",
    name: "West Zone Inter-Club Championship 2026",
    date: "2026-08-15",
    venue: "Pune Indoor Stadium",
    state_zone: "West Zone",
    status: "published",
    is_cross_club: true,
    organizer_club_id: MOCK_CLUB.id,
    organizer_user_id: MOCK_PROFILE.id,
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "event-mumbai-open",
    name: "Mumbai Open Talent Hunt",
    date: "2026-09-20",
    venue: "NSCI Dome, Mumbai",
    state_zone: "Maharashtra",
    status: "draft",
    is_cross_club: true,
    organizer_club_id: MOCK_CLUB.id,
    organizer_user_id: MOCK_PROFILE.id,
    created_at: "2026-07-01T00:00:00Z",
  },
];

export const MOCK_EVENT_CLUBS = [
  { id: "ec1", event_id: "event-west-zone", club: { name: "Mumbai Warriors Boxing Club" } },
  { id: "ec2", event_id: "event-west-zone", club: { name: "Pune Striking Academy" } },
  { id: "ec3", event_id: "event-west-zone", club: { name: "Nashik Fight Club" } },
];

export const MOCK_CLUBS: Club[] = [
  MOCK_CLUB,
  { id: "club-pune", name: "Pune Striking Academy", state_unit: "Maharashtra", settings: {}, created_at: "" },
  { id: "club-nashik", name: "Nashik Fight Club", state_unit: "Maharashtra", settings: {}, created_at: "" },
  { id: "club-delhi", name: "Delhi Champions BC", state_unit: "Delhi", settings: {}, created_at: "" },
];

export const MOCK_DASHBOARD = {
  fighterCount: MOCK_ALL_FIGHTERS.length,
  upcomingCount: 2,
  activeBrackets: 2,
  pendingResults: 2,
  upcomingBouts: MOCK_BOUTS.filter((b) => b.status === "scheduled"),
  recentResults: MOCK_BOUTS.filter((b) => b.status === "completed"),
};

export const MOCK_CREDENTIALS = {
  note: "Local Supabase is seeded — log in at /login for live data from the database.",
  sampleLogin: {
    email: "coach@mumbaiwarriors.in",
    password: "demo123456",
    note: "Works with local Supabase (npm run db:start). Demo UI still available at /demo.",
  },
  club: MOCK_CLUB.name,
  coach: MOCK_PROFILE.full_name,
  role: "club_admin",
};

export const MOCK_CATEGORIES = [
  { id: youth.id, name: "Youth", weight_classes: ["48 kg", "51 kg", "54 kg", "57 kg", "60 kg", "63 kg", "66 kg", "70 kg", "75 kg", "80 kg", "+80 kg"] },
  { id: elite.id, name: "Elite", weight_classes: ["46-49 kg", "52 kg", "56 kg", "60 kg", "64 kg", "69 kg", "75 kg", "81 kg", "91 kg", "+91 kg"] },
  { id: "cat-sub", name: "Sub-Junior", weight_classes: ["33-35 kg", "37 kg", "40 kg", "43 kg", "46 kg", "49 kg", "52 kg", "55 kg", "58 kg", "61 kg", "64 kg", "67 kg", "70 kg", "+70 kg"] },
];
