// packages/ui/src/button.tsx
"use client";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "accent" | "inverse" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label. Hidden from screen readers. */
  iconStart?: ReactNode;
  /** Icon after the label. Hidden from screen readers. */
  iconEnd?: ReactNode;
  /** Stretch to the container width. */
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { href?: undefined };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
    /** Links can't be disabled natively; this renders aria-disabled and blocks clicks. */
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Shared look. Font, tracking, and border come from Webflow button tokens.
// font-bold = 700, matching --rr-button-font-weight.
const base =
  "inline-flex items-center justify-center gap-2 border-solid font-button uppercase " +
  "font-bold leading-[var(--rr-button-line-height)] " +
  "tracking-[var(--rr-button-letter-spacing)] no-underline select-none cursor-pointer " +
  "transition-colors duration-150 " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-cyan " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

const sizes: Record<ButtonSize, string> = {
  sm:
    "text-[length:var(--rr-button-sm-font-size)] rounded-[var(--rr-button-sm-radius)] " +
    "border-[length:var(--rr-button-sm-border-width)] pt-[var(--rr-button-sm-padding-top)] " +
    "pb-[var(--rr-button-sm-padding-bottom)] px-[var(--rr-button-sm-padding-inline)]",
  md:
    "text-[length:var(--rr-button-md-font-size)] rounded-[var(--rr-button-md-radius)] " +
    "border-[length:var(--rr-button-md-border-width)] pt-[var(--rr-button-md-padding-top)] " +
    "pb-[var(--rr-button-md-padding-bottom)] px-[var(--rr-button-md-padding-inline)]",
  lg:
    "text-[length:var(--rr-button-lg-font-size)] rounded-[var(--rr-button-lg-radius)] " +
    "border-[length:var(--rr-button-lg-border-width)] pt-[var(--rr-button-lg-padding-top)] " +
    "pb-[var(--rr-button-lg-padding-bottom)] px-[var(--rr-button-lg-padding-inline)]",
};

// Hover styles are skipped while disabled so a disabled button never looks clickable.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white border-primary " +
    "enabled:hover:bg-primary-fade enabled:hover:border-primary-fade [&[href]:not([aria-disabled])]:hover:bg-primary-fade",
  secondary:
    "bg-transparent text-primary border-primary " +
    "enabled:hover:bg-frost [&[href]:not([aria-disabled])]:hover:bg-frost",
  accent:
    "bg-aqua text-primary border-aqua " +
    "enabled:hover:bg-aqua-fade enabled:hover:border-aqua-fade [&[href]:not([aria-disabled])]:hover:bg-aqua-fade",
  inverse:
    "bg-light-1 text-primary border-light-1 " +
    "enabled:hover:bg-powder enabled:hover:border-powder [&[href]:not([aria-disabled])]:hover:bg-powder",
  ghost:
    "bg-transparent text-primary border-transparent " +
    "enabled:hover:border-primary [&[href]:not([aria-disabled])]:hover:border-primary",
  danger:
    "bg-red text-white border-red " +
    "enabled:hover:bg-red-fade enabled:hover:border-red-fade [&[href]:not([aria-disabled])]:hover:bg-red-fade",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: Pick<BaseProps, "variant" | "size" | "fullWidth" | "className"> = {}): string {
  return cn(base, sizes[size], variants[variant], fullWidth && "w-full", className);
}

function Content({ iconStart, iconEnd, children }: Pick<BaseProps, "iconStart" | "iconEnd" | "children">) {
  return (
    <>
      {iconStart ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {iconStart}
        </span>
      ) : null}
      {children}
      {iconEnd ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {iconEnd}
        </span>
      ) : null}
    </>
  );
}

/**
 * REVREBEL Button. Renders a <button>, or an <a> when `href` is set.
 *
 * <Button>Save</Button>
 * <Button variant="secondary" size="sm" href="/playlist">Open playlist</Button>
 */
export function Button(props: ButtonProps) {
  const { variant, size, fullWidth, className, iconStart, iconEnd, children } = props;
  const classes = buttonClasses({ variant, size, fullWidth, className });

  if (props.href !== undefined) {
    const {
      variant: _v, size: _s, fullWidth: _f, className: _c, iconStart: _is, iconEnd: _ie, children: _ch,
      disabled, onClick, href, ...rest
    } = props;
    return (
      <a
        {...rest}
        href={disabled ? undefined : href}
        role={disabled ? "link" : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : rest.tabIndex}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={classes}
      >
        <Content iconStart={iconStart} iconEnd={iconEnd}>{children}</Content>
      </a>
    );
  }

  const {
    variant: _v, size: _s, fullWidth: _f, className: _c, iconStart: _is, iconEnd: _ie, children: _ch,
    type = "button", ...rest
  } = props;
  return (
    <button {...rest} type={type} className={classes}>
      <Content iconStart={iconStart} iconEnd={iconEnd}>{children}</Content>
    </button>
  );
}
