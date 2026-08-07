import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { regenerateAllProgressiveKnockoutBrackets } from "./services";

const url =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe("regenerate progressive knockout brackets", () => {
  it("rebuilds published fixtures with the current bracket engine", async () => {
    if (process.env.REGENERATE_BRACKETS !== "1") {
      console.warn("Skipping bracket regeneration: set REGENERATE_BRACKETS=1 to run");
      return;
    }

    if (!url || !serviceRoleKey) {
      console.warn("Skipping bracket regeneration: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
      return;
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const results = await regenerateAllProgressiveKnockoutBrackets(supabase);
    const updated = results.filter((result) => !result.skipped);
    const skipped = results.filter((result) => result.skipped);

    console.log(
      JSON.stringify(
        {
          updated: updated.length,
          skipped: skipped.length,
          details: results,
        },
        null,
        2
      )
    );

    expect(updated.length + skipped.length).toBe(results.length);
  });
});
