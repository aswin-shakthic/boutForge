import type { UserRole } from "./types";

type Permission =
  | "manage_all_clubs"
  | "create_cross_club_events"
  | "crud_fighters"
  | "import_fighters"
  | "create_internal_bouts"
  | "confirm_pairings"
  | "record_results"
  | "customize_categories"
  | "invite_members"
  | "view_data";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  platform_admin: [
    "manage_all_clubs",
    "create_cross_club_events",
    "crud_fighters",
    "import_fighters",
    "create_internal_bouts",
    "confirm_pairings",
    "record_results",
    "customize_categories",
    "invite_members",
    "view_data",
  ],
  matchmaker: [
    "create_cross_club_events",
    "confirm_pairings",
    "record_results",
    "view_data",
  ],
  club_admin: [
    "crud_fighters",
    "import_fighters",
    "create_internal_bouts",
    "confirm_pairings",
    "record_results",
    "customize_categories",
    "invite_members",
    "view_data",
  ],
  coach: [
    "crud_fighters",
    "import_fighters",
    "create_internal_bouts",
    "record_results",
    "view_data",
  ],
  viewer: ["view_data"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageFighters(role: UserRole): boolean {
  return hasPermission(role, "crud_fighters");
}

export function canRecordResults(role: UserRole): boolean {
  return hasPermission(role, "record_results");
}

export function canEditPairings(role: UserRole): boolean {
  return hasPermission(role, "confirm_pairings") || hasPermission(role, "create_internal_bouts");
}

export function canCreateBrackets(role: UserRole): boolean {
  return hasPermission(role, "create_internal_bouts") || hasPermission(role, "confirm_pairings");
}

export function canManageEvents(role: UserRole, isPlatformAdmin?: boolean): boolean {
  return isPlatformAdmin || hasPermission(role, "create_cross_club_events");
}

export function canManageClub(role: UserRole): boolean {
  return hasPermission(role, "invite_members") || hasPermission(role, "customize_categories");
}

export function canAccessAdmin(role: UserRole, isPlatformAdmin?: boolean): boolean {
  return isPlatformAdmin || role === "platform_admin";
}
