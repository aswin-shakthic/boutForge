import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { club_id, rows } = await req.json();

    if (!club_id || !rows || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "club_id and rows array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ageCategories } = await supabase
      .from("age_categories")
      .select("*");
    const { data: weightClasses } = await supabase
      .from("weight_classes")
      .select("*")
      .eq("is_enabled", true);

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parts = (row.name ?? "").trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ") || firstName;
      const gender = (row.gender ?? "").trim().toLowerCase();

      if (!firstName || !row.birth_year || !gender || !row.weight_kg) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      const birthYear = parseInt(String(row.birth_year).trim(), 10);
      const currentYear = new Date().getFullYear();
      if (
        !Number.isInteger(birthYear) ||
        birthYear < 1900 ||
        birthYear > currentYear
      ) {
        errors.push(
          `Row ${i + 1}: birth_year must be a whole year between 1900 and ${currentYear}`
        );
        continue;
      }

      if (gender !== "male" && gender !== "female") {
        errors.push(`Row ${i + 1}: Gender must be male or female`);
        continue;
      }

      if (!Number.isFinite(Number(row.weight_kg)) || Number(row.weight_kg) <= 0) {
        errors.push(`Row ${i + 1}: Weight must be a positive number`);
        continue;
      }

      const dob = `${birthYear}-01-01`;
      const age = currentYear - birthYear;

      const ageCategory = (ageCategories ?? []).find(
        (c: { min_age: number; max_age: number }) =>
          age >= c.min_age && age <= c.max_age
      );

      const weightClass = ageCategory
        ? (weightClasses ?? []).find(
            (wc: {
              gender: string;
              age_category_id: string;
              min_weight_kg: number | null;
              max_weight_kg: number | null;
            }) =>
              wc.gender === gender &&
              wc.age_category_id === ageCategory.id &&
              (wc.min_weight_kg === null || row.weight_kg >= wc.min_weight_kg) &&
              (wc.max_weight_kg === null || row.weight_kg <= wc.max_weight_kg)
          )
        : null;

      const { error } = await supabase.from("fighters").insert({
        club_id,
        first_name: firstName,
        last_name: lastName,
        dob,
        gender,
        weight_kg: row.weight_kg,
        age_category_id: ageCategory?.id ?? null,
        weight_class_id: weightClass?.id ?? null,
      });

      if (error) errors.push(`Row ${i + 1}: ${error.message}`);
      else imported++;
    }

    return new Response(
      JSON.stringify({ imported, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
