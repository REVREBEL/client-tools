# @revrebel/ui

Shared REVREBEL React 19 components, styled only with `@revrebel/tokens` classes.

## Use in a Next.js app

1. `package.json`: `"@revrebel/ui": "workspace:*"` and `"@revrebel/tokens": "workspace:*"`
2. `next.config`: `transpilePackages: ["@revrebel/ui"]`
3. Global CSS (path is relative to the CSS file):

```css
@import "tailwindcss";
@import "@revrebel/tokens/index.css";
@source "../../../packages/ui/src";
```

## Components

- `Button`: variants `primary | secondary | accent | inverse | ghost | danger`, sizes `sm | md | lg`, optional `href`, `iconStart`, `iconEnd`, `fullWidth`.
