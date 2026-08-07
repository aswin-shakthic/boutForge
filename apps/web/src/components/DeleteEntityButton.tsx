"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEntityButton({
  label,
  confirmMessage,
  onDelete,
  redirectTo,
  disabled = false,
}: {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  redirectTo: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;

    setError("");
    setLoading(true);
    try {
      await onDelete();
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="btn-danger text-sm"
      >
        {loading ? "Deleting…" : label}
      </button>
    </div>
  );
}
