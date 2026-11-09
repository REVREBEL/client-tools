// apps/design-system/components/foundations.tsx
// Live token previews used by the Foundations MDX pages.
import { Button, type ButtonSize, type ButtonVariant } from '@revrebel/ui';

const families = [
  'primary', 'teal', 'cyan', 'aqua', 'powder', 'yellow', 'orange',
  'red', 'purple', 'frost', 'grey-1', 'grey-2', 'grey-3',
] as const;

const steps = ['', '-fade', '-inverse', '-inverse-fade'] as const;

function Swatch({ name }: { name: string }) {
  return (
    <div className="not-prose flex flex-col gap-1">
      <div
        className="h-14 rounded-sm border border-black/10"
        style={{ background: `var(--rr-color-${name})` }}
      />
      <code className="text-xs">{name}</code>
    </div>
  );
}

export function ColorFamilies() {
  return (
    <div className="not-prose my-6 flex flex-col gap-5">
      {families.map((family) => (
        <div key={family} className="grid grid-cols-4 gap-3">
          {steps.map((step) => (
            <Swatch key={step} name={`${family}${step}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ColorList({ names }: { names: string[] }) {
  return (
    <div className="not-prose my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {names.map((name) => (
        <Swatch key={name} name={name} />
      ))}
    </div>
  );
}

const typeRoles = [
  ['type-h0', 'Headline h0'], ['type-h1', 'Headline h1'], ['type-h2', 'Headline h2'],
  ['type-h3', 'Headline h3'], ['type-h4', 'Headline h4'], ['type-h5', 'Headline h5'],
  ['type-h6', 'Headline h6'], ['type-s0', 'Subheadline s0'], ['type-s1', 'Subheadline s1'],
  ['type-s2', 'Subheadline s2'], ['type-s3', 'Subheadline s3'], ['type-s4', 'Subheadline s4'],
  ['type-s5', 'Subheadline s5'], ['type-s6', 'Subheadline s6'],
  ['type-p-xl', 'Paragraph xl'], ['type-p-lg', 'Paragraph lg'], ['type-p-md', 'Paragraph md'],
  ['type-p', 'Paragraph base'], ['type-p-sm', 'Paragraph sm'], ['type-p-xs', 'Paragraph xs'],
  ['type-p-xxs', 'Paragraph xxs'], ['type-eyebrow uppercase', 'Eyebrow'],
  ['type-label uppercase', 'Label'], ['type-blockquote', 'Blockquote'],
] as const;

export function TypeScale() {
  return (
    <div className="not-prose my-6 flex flex-col divide-y divide-black/10 text-primary">
      {typeRoles.map(([cls, label]) => (
        <div key={cls} className="flex flex-col gap-2 py-4">
          <code className="text-xs text-grey-2">{cls}</code>
          <span className={cls}>{label}</span>
        </div>
      ))}
    </div>
  );
}

const fontRoles = [
  'headline', 'subheadline', 'eyebrow', 'body', 'button', 'labels', 'code', 'logo', 'blockquote',
] as const;

export function FontFamilies() {
  return (
    <div className="not-prose my-6 flex flex-col gap-3 text-primary">
      {fontRoles.map((role) => (
        <div key={role} className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
          <span className="text-2xl" style={{ fontFamily: `var(--rr-font-${role})` }}>
            The quick brown fox, 0123456789
          </span>
          <code className="shrink-0 text-xs">--rr-font-{role}</code>
        </div>
      ))}
    </div>
  );
}

const gaps = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

export function GapScale() {
  return (
    <div className="not-prose my-6 flex flex-col gap-2">
      {gaps.map((gap) => (
        <div key={gap} className="flex items-center gap-4">
          <code className="w-16 shrink-0 text-xs">gap-{gap}</code>
          <div className="h-4 bg-aqua" style={{ width: `var(--rr-gap-${gap})` }} />
        </div>
      ))}
    </div>
  );
}

const radii = ['sm', 'md', 'lg', 'xl', 'round', 'image'] as const;

export function RadiusScale() {
  return (
    <div className="not-prose my-6 flex flex-wrap gap-4">
      {radii.map((radius) => (
        <div key={radius} className="flex flex-col items-center gap-2">
          <div
            className="size-20 border-3 border-primary bg-frost"
            style={{ borderRadius: radius === 'image' ? 'var(--rr-image-radius)' : `var(--rr-radius-${radius})` }}
          />
          <code className="text-xs">rounded-{radius}</code>
        </div>
      ))}
    </div>
  );
}

const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'inverse', 'ghost', 'danger'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

export function ButtonVariants() {
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-3 rounded-md bg-light-1 p-6">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  );
}

export function ButtonSizes() {
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-3 rounded-md bg-light-1 p-6">
      {sizes.map((size) => (
        <Button key={size} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  );
}

export function ButtonStates() {
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-3 rounded-md bg-light-1 p-6">
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button href="#states">As link</Button>
      <Button href="#states" disabled>Disabled link</Button>
      <Button variant="secondary" iconEnd={<span>→</span>}>With icon</Button>
    </div>
  );
}

export function ButtonOnDark() {
  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-3 rounded-md bg-primary p-6">
      <Button variant="inverse">Inverse</Button>
      <Button variant="accent">Accent</Button>
    </div>
  );
}
