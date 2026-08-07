"use client";

import type { ReactElement } from "react";

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <span className="tooltip-wrap inline-flex">
      {children}
      <span role="tooltip" className="tooltip-bubble">
        {label}
      </span>
    </span>
  );
}
