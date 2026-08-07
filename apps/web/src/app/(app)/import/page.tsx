"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserClubs, importFightersFromCSV } from "@boutforge/api";
import { canImportFighters } from "@boutforge/shared";
import type { ClubMember } from "@boutforge/shared";
import { ClubSelector } from "@/components/ClubSelector";

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
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [canImport, setCanImport] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
    clubName: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const clubs = await getUserClubs(supabase, user.id);
      setMemberships(clubs);
      if (clubs.length > 0) {
        setSelectedClubId(clubs[0].club_id);
        setCanImport(canImportFighters(clubs[0].role));
      }
    }
    load();
  }, [supabase]);

  function handleClubChange(clubId: string) {
    setSelectedClubId(clubId);
    const membership = memberships.find((entry) => entry.club_id === clubId);
    setCanImport(membership ? canImportFighters(membership.role) : false);
    setResult(null);
    setError("");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedClubId) return;

    if (!canImport) {
      setError("You do not have permission to import fighters for this club.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const text = await file.text();
    const rows = parseCSV(text);
    const clubName =
      memberships.find((entry) => entry.club_id === selectedClubId)?.club?.name ??
      "Selected club";

    try {
      const res = await importFightersFromCSV(supabase, selectedClubId, rows);
      setResult({ ...res, clubName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
    setLoading(false);
    e.target.value = "";
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Import Fighters</h1>

      <div className="card space-y-4">
        <ClubSelector
          memberships={memberships}
          selectedClubId={selectedClubId}
          onChange={handleClubChange}
          description="Fighters will be added to this club's roster with auto-assigned age and weight categories."
        />

        {!canImport && selectedClubId ? (
          <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            Your role for this club does not allow CSV import.
          </div>
        ) : null}

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
          disabled={loading || !selectedClubId || !canImport}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-boxing file:text-white file:cursor-pointer disabled:opacity-50"
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
              Imported {result.imported} fighter{result.imported === 1 ? "" : "s"} to{" "}
              <strong>{result.clubName}</strong>.
            </p>
            {result.errors.length > 0 && (
              <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Errors:</p>
                {result.errors.map((entry, i) => (
                  <p key={i}>{entry}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
