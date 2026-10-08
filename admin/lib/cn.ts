/**
 * Minimal `cn()` class-name joiner.
 *
 * Tailwind is in use, so the spec's usual suggestion is `clsx` +
 * `tailwind-merge`. This project ships neither, and adding two more runtime
 * dependencies for a two-line helper is not worth it: the class strings in this
 * app are all authored in one place per component, so Tailwind never has to
 * arbitrate between two conflicting utilities from different sources. Every
 * conditional class here is a whole-token `... ? "a b" : "c b"` swap, which
 * concatenation already handles correctly.
 *
 * Accepts the `clsx` call shapes that matter — strings, conditionals, arrays —
 * plus `false`/`null`/`undefined` so `cond && "class"` reads naturally.
 * Falsy entries are dropped rather than stringified.
 *
 * Exported as `cn` to match the convention used across the wider ecosystem.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value && value !== 0) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(" ");
}
