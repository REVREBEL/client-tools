// packages/ui/src/cn.ts
// Joins class names and skips falsy values: cn("a", isOn && "b") -> "a b".
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
