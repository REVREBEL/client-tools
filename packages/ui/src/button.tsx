// packages/ui/src/button.tsx
"use client";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cn } from "./cn";

/** The 13 canonical REVREBEL color families. */
export const BUTTON_COLORS = [
  "primary", "teal", "cyan", "aqua", "powder", "yellow", "orange",
  "red", "purple", "frost", "grey-1", "grey-2", "grey-3",
] as const;

export type ButtonColor = (typeof BUTTON_COLORS)[number];
export type ButtonColorMode = "normal" | "inverse" | "inherit";
export type ButtonColorStyle = "filled" | "outline";
export type ButtonSize = "xs" | "sm" | "base" | "md" | "lg";
export type ButtonHoverEffect = "inverse" | "fade";
export type ButtonIconPlacement = "before" | "after";

type BaseProps = {
  /** Color family. Default `primary`. */
  color?: ButtonColor;
  /** `normal` = family color as surface, `inverse` = paired color as surface, `inherit` = follow text color. */
  colorMode?: ButtonColorMode;
  /** `filled` (solid surface) or `outline` (border + colored label). */
  colorStyle?: ButtonColorStyle;
  /** Default `base`. */
  size?: ButtonSize;
  /** Turns hover/pressed feedback on. Default `true`. */
  clickable?: boolean;
  /** Hover feedback when clickable. Default `inverse` (flip + 3D shadow). */
  hoverEffect?: ButtonHoverEffect;
  /** Decorative icon. Hidden from screen readers. */
  icon?: ReactNode;
  /** Default `after`. */
  iconPlacement?: ButtonIconPlacement;
  /** Wraps the label in REVREBEL brackets: [ LABEL ]. Brackets are hidden from screen readers. */
  bracketed?: boolean;
  /** Forces a visual state for documentation only. */
  forceState?: "hover" | "pressed";
  className?: string;
  children?: ReactNode;
};

type NativeButton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps | "color">;
type NativeAnchor = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | "color">;

export type ButtonProps =
  | (BaseProps & NativeButton & { href?: undefined })
  | (BaseProps & NativeAnchor & { href: string; disabled?: boolean });

const OWN_KEYS = [
  "color", "colorMode", "colorStyle", "size", "clickable", "hoverEffect",
  "icon", "iconPlacement", "bracketed", "forceState", "className", "children",
] as const;

function splitProps<T extends object>(props: T) {
  const rest: Record<string, unknown> = { ...props };
  for (const key of OWN_KEYS) delete rest[key];
  return rest;
}

function Label({ bracketed, children }: { bracketed?: boolean; children?: ReactNode }) {
  if (!bracketed) return <span>{children}</span>;
  return (
    <span>
      <span aria-hidden="true" className="rr-button__bracket">[ </span>
      {children}
      <span aria-hidden="true" className="rr-button__bracket"> ]</span>
    </span>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="rr-button__icon">
      {children}
    </span>
  );
}

/**
 * REVREBEL Button — React port of the Webflow `c-button`.
 * Renders a <button>, or an <a> when `href` is set.
 *
 * <Button>Book a call</Button>
 * <Button color="teal" colorStyle="outline" size="sm" href="/playlist" bracketed>Open playlist</Button>
 */
export function Button(props: ButtonProps) {
  const {
    color = "primary",
    colorMode = "normal",
    colorStyle = "filled",
    size = "base",
    clickable = true,
    hoverEffect = "inverse",
    icon,
    iconPlacement = "after",
    bracketed = false,
    forceState,
    className,
    children,
  } = props;

  const dataAttrs = {
    "data-color": color,
    "data-color-mode": colorMode,
    "data-color-style": colorStyle,
    "data-size": size,
    "data-clickable": clickable ? "enable" : "disable",
    "data-hover-effect": clickable ? hoverEffect : undefined,
  };

  const classes = cn(
    "rr-button",
    forceState === "hover" && "is-hover-state",
    forceState === "pressed" && "is-pressed-state",
    className,
  );

  const content = (
    <>
      {icon && iconPlacement === "before" ? <Icon>{icon}</Icon> : null}
      <Label bracketed={bracketed}>{children}</Label>
      {icon && iconPlacement === "after" ? <Icon>{icon}</Icon> : null}
    </>
  );

  if (props.href !== undefined) {
    const { href, disabled, onClick, tabIndex, ...rest } = splitProps(props) as NativeAnchor & {
      href: string;
      disabled?: boolean;
    };
    return (
      <a
        {...rest}
        {...dataAttrs}
        href={disabled ? undefined : href}
        role={disabled ? "link" : rest.role}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : tabIndex}
        onClick={disabled ? (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault() : onClick}
        className={classes}
      >
        {content}
      </a>
    );
  }

  const { type = "button", ...rest } = splitProps(props) as NativeButton;
  return (
    <button {...rest} {...dataAttrs} type={type} className={classes}>
      {content}
    </button>
  );
}
