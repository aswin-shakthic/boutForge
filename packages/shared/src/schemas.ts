import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name is required"),
  club_name: z.string().optional(),
  invite_token: z.string().optional(),
}).refine(
  (data) => data.club_name || data.invite_token,
  { message: "Either club name or invite code is required", path: ["club_name"] }
);

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const fighterSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"]),
  weight_kg: z.number().positive("Weight must be positive"),
  notes: z.string().optional(),
});

export const boutResultSchema = z.object({
  winner_id: z.string().uuid().nullable(),
  method: z.enum(["KO", "TKO", "UD", "SD", "MD", "DQ", "RSC", "NC", "DRAW"]),
  round_ended: z.number().int().min(1).max(12).nullable(),
  scorecards: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

export const eventSchema = z.object({
  name: z.string().min(2, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  venue: z.string().optional(),
  state_zone: z.string().optional(),
  is_cross_club: z.boolean().default(false),
});

export const bracketSchema = z.object({
  name: z.string().min(2, "Bracket name is required"),
  format: z.enum(["progressive_knockout", "round_robin", "manual"]),
  fighter_ids: z.array(z.string().uuid()).min(2, "At least 2 fighters required"),
  bye_fighter_id: z.string().uuid().optional(),
  venue: z.string().optional(),
  scheduled_date: z.string().optional(),
});

export const inviteSchema = z.object({
  role: z.enum(["club_admin", "coach", "viewer"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type FighterFormInput = z.infer<typeof fighterSchema>;
export type BoutResultInput = z.infer<typeof boutResultSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type BracketInput = z.infer<typeof bracketSchema>;
