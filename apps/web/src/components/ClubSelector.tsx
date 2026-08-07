"use client";

import type { ClubMember } from "@boutforge/shared";

export function ClubSelector({
  memberships,
  selectedClubId,
  onChange,
  label = "Club",
  description,
}: {
  memberships: ClubMember[];
  selectedClubId: string;
  onChange: (clubId: string) => void;
  label?: string;
  description?: string;
}) {
  const selected = memberships.find((entry) => entry.club_id === selectedClubId);

  if (memberships.length === 0) {
    return <p className="text-sm text-gray-500">No club membership found.</p>;
  }

  if (memberships.length === 1) {
    return (
      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {description ? <p className="text-gray-500 mb-1">{description}</p> : null}
        <span className="font-medium text-navy">{selected?.club?.name ?? "Your club"}</span>
      </div>
    );
  }

  return (
    <div>
      {description ? <p className="text-sm text-gray-500 mb-2">{description}</p> : null}
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        className="input-field"
        value={selectedClubId}
        onChange={(e) => onChange(e.target.value)}
      >
        {memberships.map((entry) => (
          <option key={entry.club_id} value={entry.club_id}>
            {entry.club?.name ?? entry.club_id}
          </option>
        ))}
      </select>
    </div>
  );
}
