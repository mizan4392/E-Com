/**
 * Derives the active state for a nav item from the current pathname.
 *
 * Kept separate from the component so the exact/prefix rules can be unit
 * reasoned about (and reused by tests) without rendering anything, and so both
 * the desktop sidebar and the mobile drawer answer the question identically.
 */

/**
 * True when `pathname` is the item's route.
 *
 * `match: "exact"` compares for equality, which is what `/` needs: with a
 * prefix match the dashboard would light up on every page in the app, because
 * every route starts with a slash.
 *
 * `match: "prefix"` additionally matches nested paths, but only on a segment
 * boundary — `/products-old` does not count as being inside `/products`.
 */
export function isNavItemActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix" = "exact",
): boolean {
  if (match === "exact") return pathname === href;

  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}
