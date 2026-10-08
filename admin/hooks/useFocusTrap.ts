"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Confines Tab focus to `ref` while `active`, and restores focus to whatever
 * was focused before on teardown.
 *
 * Used by the mobile drawer, which is a modal overlay: without this, Tab walks
 * straight out of the open menu and into the page behind it, which is both a
 * keyboard trap in the bad sense and invisible to a sighted user because the
 * drawer does not visually cover the whole viewport.
 *
 * The listener is on `document` rather than the container so focus that escapes
 * (e.g. the browser's find bar, or a programmatic `.focus()`) is still caught
 * and pulled back.
 *
 * @param ref    Element that focus must stay inside.
 * @param active Whether the trap is engaged.
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean,
) {
  // Captured on the first active render so teardown can return focus even if
  // the trigger button has since been removed from the DOM.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = ref.current;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    container?.focus();

    function getFocusable(): HTMLElement[] {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;

      // Wrap forwards from the last element, and backwards from the first.
      if (
        event.shiftKey &&
        (current === first || !container?.contains(current))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [active, ref]);
}
