"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserClubs, importFightersFromCSV } from "@boutforge/api";
import { canImportFighters, parseBirthYear } from "@boutforge/shared";
import type { ClubMember } from "@boutforge/shared";
import { ClubSelector } from "@/components/ClubSelector";

function parseCSV(text: string): Array<{
  name: string;
  birth_year: number;
  gender: string;
  weight_kg: number;
  club_name?: string;
}> {
  const lines = text.trim().split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const nameIdx = header.findIndex((h) => h === "name");
  const birthYearIdx = header.findIndex(
    (h) => h === "birth_year" || h === "birthyear" || h === "year"
  );
  const genderIdx = header.findIndex((h) => h === "gender" || h === "sex");
  const weightIdx = header.findIndex(
    (h) => h === "weight_kg" || h === "weight"
  );
  const clubIdx = header.findIndex((h) => h === "club_name" || h === "club");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const clubName = clubIdx >= 0 ? cols[clubIdx] : undefined;
    const birthYearRaw = birthYearIdx >= 0 ? cols[birthYearIdx] ?? "" : "";
    const birthYear = parseBirthYear(birthYearRaw) ?? 0;

    return {
      name: cols[nameIdx] ?? "",
      birth_year: birthYear,
      gender: cols[genderIdx] ?? "",
      weight_kg: parseFloat(cols[weightIdx] ?? "0"),
      club_name: clubName || undefined,
    };
  });
}

export default function ImportPage() {
  const supabase = createClient();
  const [memberships, setMemberships] = useState<ClubMember[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [csvPaste, setCsvPaste] = useState("");
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
    clubCounts: Array<{ club_id: string; club_name: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const importableMemberships = useMemo(
    () => memberships.filter((entry) => canImportFighters(entry.role)),
    [memberships]
  );

  const importDisabled =
    loading || !selectedClubId || importableMemberships.length === 0;

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const clubs = await getUserClubs(supabase, user.id);
      setMemberships(clubs);
      const firstImportable = clubs.find((entry) => canImportFighters(entry.role));
      if (firstImportable) {
        setSelectedClubId(firstImportable.club_id);
      } else if (clubs.length > 0) {
        setSelectedClubId(clubs[0].club_id);
      }
    }
    load();
  }, [supabase]);

  function handleClubChange(clubId: string) {
    setSelectedClubId(clubId);
    setResult(null);
    setError("");
  }

  async function runImport(text: string) {
    if (!selectedClubId) return;

    if (importableMemberships.length === 0) {
      setError("You do not have permission to import fighters for any club.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const rows = parseCSV(text);

    if (rows.length === 0) {
      setError("CSV is empty or missing a header row.");
      setLoading(false);
      return;
    }

    try {
      const res = await importFightersFromCSV(
        supabase,
        selectedClubId,
        rows,
        memberships
      );
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
    setLoading(false);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    await runImport(text);
    e.target.value = "";
  }

  async function handlePasteImport() {
    if (!csvPaste.trim()) {
      setError("Paste CSV content before importing.");
      return;
    }

    await runImport(csvPaste);
  }

  function handlePasteExample() {
    setCsvPaste(`name,birth_year,gender,weight_kg,club_name
Rahul Sharma,2008,male,58,Mumbai Warriors
Amit Patel,2009,male,59,`);
    setResult(null);
    setError("");
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Import Fighters</h1>

      <div className="card space-y-4">
        <ClubSelector
          memberships={memberships}
          selectedClubId={selectedClubId}
          onChange={handleClubChange}
          description="Default club when a row has no club_name column. Use club_name in CSV to import into different clubs in one file."
        />

        {importableMemberships.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            Your roles do not allow CSV import for any club.
          </div>
        ) : null}

        <p className="text-sm text-gray-500">
          Upload a file or paste CSV with columns:{" "}
          <code className="bg-gray-100 px-1 rounded">
            name, birth_year, gender, weight_kg
          </code>{" "}
          and optional{" "}
          <code className="bg-gray-100 px-1 rounded">club_name</code>.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600 overflow-x-auto">
          name,birth_year,gender,weight_kg,club_name
          <br />
          Rahul Sharma,2008,male,58,Mumbai Warriors
          <br />
          Amit Patel,2009,male,59,
        </div>

        <p className="text-xs text-gray-500">
          Leave <code className="bg-gray-100 px-1 rounded">club_name</code> blank
          to use the default club above. Names must match your clubs exactly.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">Upload CSV file</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            disabled={importDisabled}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-boxing file:text-white file:cursor-pointer disabled:opacity-50"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">Or paste CSV</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="csv-paste" className="block text-sm font-medium">
              Paste CSV content
            </label>
            <button
              type="button"
              onClick={handlePasteExample}
              disabled={importDisabled}
              className="text-xs text-boxing hover:underline disabled:opacity-50"
            >
              Use example
            </button>
          </div>
          <textarea
            id="csv-paste"
            rows={8}
            value={csvPaste}
            onChange={(e) => {
              setCsvPaste(e.target.value);
              setResult(null);
              setError("");
            }}
            placeholder={`name,birth_year,gender,weight_kg,club_name\nRahul Sharma,2008,male,58,Mumbai Warriors\nAmit Patel,2009,male,59,`}
            disabled={importDisabled}
            className="input-field font-mono text-xs min-h-[10rem] resize-y"
          />
          <button
            type="button"
            onClick={handlePasteImport}
            disabled={importDisabled || !csvPaste.trim()}
            className="btn-primary mt-3"
          >
            Import pasted CSV
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Importing...</p>}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <p className="text-green-700 bg-green-50 px-4 py-3 rounded-lg text-sm">
              Imported {result.imported} fighter{result.imported === 1 ? "" : "s"}
              successfully.
            </p>
            {result.clubCounts.length > 0 && (
              <ul className="text-sm text-gray-700 space-y-1">
                {result.clubCounts.map((entry) => (
                  <li key={entry.club_id}>
                    <strong>{entry.club_name}</strong>: {entry.count} fighter
                    {entry.count === 1 ? "" : "s"}
                  </li>
                ))}
              </ul>
            )}
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
