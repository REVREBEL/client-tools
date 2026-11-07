'use client';

export type PreviewButtonProps = {
  label?: string;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
};

export function PreviewButton({
  label = 'Preview component',
  variant = 'primary',
  disabled = false,
}: PreviewButtonProps) {
  const variantClasses =
    variant === 'primary'
      ? 'bg-[var(--rr-blue)] text-white border-[var(--rr-blue)] hover:bg-[var(--rr-blue-dark)]'
      : 'bg-transparent text-[var(--rr-blue)] border-[var(--rr-blue)] hover:bg-[var(--rr-frost)]';

  return (
    <button
      type="button"
      disabled={disabled}
      className={`min-h-11 border-2 px-5 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses}`}
    >
      {label}
    </button>
  );
}
