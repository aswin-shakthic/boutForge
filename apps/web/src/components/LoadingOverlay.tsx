"use client";

import type { ReactNode } from "react";
import { PageLoader } from "./PageLoader";

type LoadingOverlayProps = {
  loading: boolean;
  label?: string;
  children: ReactNode;
  /** Replace content with a centered loader (initial page fetch). */
  fullPage?: boolean;
};

export function LoadingOverlay({
  loading,
  label = "Loading…",
  children,
  fullPage = false,
}: LoadingOverlayProps) {
  if (fullPage && loading) {
    return <PageLoader label={label} />;
  }

  return (
    <div className="relative min-w-0">
      <fieldset
        disabled={loading}
        className={`min-w-0 border-0 p-0 m-0 ${loading ? "pointer-events-none select-none" : ""}`}
      >
        {children}
      </fieldset>
      {loading && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px]"
          aria-busy="true"
          aria-live="polite"
        >
          <PageLoader label={label} inline />
        </div>
      )}
    </div>
  );
}
