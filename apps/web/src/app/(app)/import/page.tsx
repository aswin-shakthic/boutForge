"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { importFightersFromCSV } from "@boutforge/api";

function parseCSV(text: string): Array<{
  name: string;
  dob: string;
  gender: string;
  weight_kg: number;
}> {
  const lines = text.trim().split("\n");
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.findIndex((h) => h === "name");
  const dobIdx = header.findIndex((h) => h === "dob" || h === "date_of_birth");
  const genderIdx = header.findIndex((h) => h === "gender" || h === "sex");
  const weightIdx = header.findIndex(
    (h) => h === "weight_kg" || h === "weight"
  );

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      name: cols[nameIdx] ?? "",
      dob: cols[dobIdx] ?? "",
      gender: cols[genderIdx] ?? "",
      weight_kg: parseFloat(cols[weightIdx] ?? "0"),
    };
  });
}

export default function ImportPage() {
  const supabase = createClient();
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const text = await file.text();
    const rows = parseCSV(text);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      setError("No club found");
      setLoading(false);
      return;
    }

    try {
      const res = await importFightersFromCSV(
        supabase,
        membership.club_id,
        rows
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Import Fighters</h1>

      <div className="card space-y-4">
        <p className="text-sm text-gray-500">
          Upload a CSV file with columns:{" "}
          <code className="bg-gray-100 px-1 rounded">name, dob, gender, weight_kg</code>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600">
          name,dob,gender,weight_kg<br />
          Rahul Sharma,2008-03-15,male,58<br />
          Amit Patel,2009-07-22,male,59
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-boxing file:text-white file:cursor-pointer"
        />

        {loading && <p className="text-sm text-gray-500">Importing...</p>}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg text-sm">
              Imported {result.imported} fighters successfully.
            </p>
            {result.errors.length > 0 && (
              <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
