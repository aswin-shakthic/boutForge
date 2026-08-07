"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export function DeleteEntityButton({
  label,
  confirmMessage,
  onDelete,
  redirectTo,
  disabled = false,
  compact = false,
}: {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  redirectTo: string;
  disabled?: boolean;
  /** Icon + tooltip only (for toolbars and tables). */
  compact?: boolean;
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

  const button = (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={compact ? "btn-danger icon-btn icon-btn-sm" : "btn-danger text-sm gap-2"}
      aria-label={label}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {!compact && <span>{loading ? "Deleting…" : label}</span>}
    </button>
  );

  return (
    <div className={compact ? "inline-flex" : undefined}>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {compact ? <Tooltip label={label}>{button}</Tooltip> : button}
    </div>
  );
}
