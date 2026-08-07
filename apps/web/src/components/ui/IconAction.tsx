"use client";

import Link from "next/link";
import {
  CalendarPlus,
  Eye,
  Pencil,
  Plus,
  Printer,
  Trophy,
  Upload,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Tooltip } from "./Tooltip";

const ICONS = {
  calendarPlus: CalendarPlus,
  eye: Eye,
  pencil: Pencil,
  plus: Plus,
  printer: Printer,
  trophy: Trophy,
  upload: Upload,
  userPlus: UserPlus,
  users: Users,
} as const satisfies Record<string, LucideIcon>;

export type IconActionIcon = keyof typeof ICONS;

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  ghost: "icon-btn-ghost",
};

type IconActionBase = {
  label: string;
  icon: IconActionIcon;
  variant?: Variant;
  /** Icon only (tooltip). "responsive" shows label from sm breakpoint up. */
  mode?: "icon" | "responsive" | "label";
  className?: string;
  disabled?: boolean;
};

type IconActionLink = IconActionBase & {
  href: string;
  onClick?: never;
  type?: never;
};

type IconActionButton = IconActionBase & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
};

export type IconActionProps = IconActionLink | IconActionButton;

export function IconAction({
  label,
  icon,
  variant = "secondary",
  mode = "icon",
  className = "",
  disabled,
  ...rest
}: IconActionProps) {
  const Icon = ICONS[icon];
  const isIconOnly = mode === "icon";
  const showLabel = mode === "label";
  const responsiveLabel = mode === "responsive";

  const classes = [
    variant === "ghost" && isIconOnly ? "icon-btn-ghost" : VARIANT_CLASS[variant],
    isIconOnly && variant !== "ghost" ? "icon-btn icon-btn-sm" : "",
    isIconOnly && variant === "ghost" ? "icon-btn" : "",
    showLabel || responsiveLabel ? "gap-2" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {showLabel && <span>{label}</span>}
      {responsiveLabel && <span className="hidden sm:inline">{label}</span>}
    </>
  );

  const ariaLabel = mode === "icon" ? label : undefined;

  const control =
    "href" in rest && rest.href ? (
      <Link href={rest.href} className={classes} aria-label={ariaLabel} title={mode === "icon" ? label : undefined}>
        {content}
      </Link>
    ) : (
      <button
        type={rest.type ?? "button"}
        onClick={rest.onClick}
        disabled={disabled}
        className={classes}
        aria-label={ariaLabel}
        title={mode === "icon" ? label : undefined}
      >
        {content}
      </button>
    );

  if (mode === "icon") {
    return <Tooltip label={label}>{control}</Tooltip>;
  }

  return control;
}
