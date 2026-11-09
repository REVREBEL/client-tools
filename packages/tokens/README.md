# @revrebel/tokens

REVREBEL design tokens, mirrored from the Webflow variable collections
(`base`, `color`, `typography`, `size`). Webflow is the source of truth.

## Use in an app

```css
/* app/globals.css */
@import "tailwindcss";
@import "@revrebel/tokens/index.css";
```

```json
// package.json
"dependencies": { "@revrebel/tokens": "workspace:*" }
```

## Files

- `src/tokens.css`: raw `--rr-*` CSS variables, plus Webflow breakpoint modes.
- `src/theme.css`: Tailwind v4 `@theme inline` mapping, which creates the utilities.
- `src/typography.css`: opt-in composite type utilities (`type-h1`, `type-s3`, `type-eyebrow` ...).

## Utility cheat sheet

- Color: `bg-primary`, `text-teal-inverse`, `border-aqua-fade`, `bg-frost`, `text-error`
- Font: `font-headline`, `font-body`, `font-button`, `font-label`, `font-code`
- Size: `text-headline-lg`, `text-subheadline-md`, `text-body-base`
- Composite: `type-h1` ... `type-h6`, `type-s0` ... `type-s6`, `type-p`, `type-eyebrow`, `type-label`
- Spacing: `gap-md`, `p-page-x`, `py-section`, `space-y-sm`
- Radius: `rounded-sm` ... `rounded-xl`, `rounded-round`, `rounded-image`
- Width: `max-w-page-base`, `max-w-frame-lg`, `w-content-sm`
- Icons: `size-icon-xs` ... `size-icon-xxl`
- Filters (CSS only): `filter: var(--rr-filter-teal)`

## Fonts

Tokens only declare the families. Each app must load them:
Khand, General Sans, Supreme, Fira Code, Noto Emoji, Logic Monoscript, Barlow.

## Webflow review list

These values are kept exactly as exported (WEBFLOW PARITY) unless noted:

1. `text-size/xl`: min/max swapped inside the slope, so it shrinks on wider screens.
2. `primary/inverse-fade`, `light/inverse-fade`: color-mix totals 110%.
3. `light/light-2`: color-mix totals 90%, which leaves it slightly transparent.
4. `line-height/sm` (0.75) is tighter than `xs` (0.95) and `xxs` (0.85).
5. `max-width/xxs` is 12px, while `width/xxs` is 12rem.
6. `responsive-text/sm` = `md` and `responsive-text/xs` = `base`.
7. `social/youtube` references the `shade` collection (`red/700`), which wasn't exported. Falls back to red for now.
8. **Corrected:** `s6/font-weight` was 1.25. Now weight 300, line-height 1.25.
9. **Corrected:** `paragraph-sm/line-height` was 1.35px. Now 1.35.
10. No shadow tokens exist in Webflow yet.
