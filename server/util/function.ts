export function getChangedValues<T extends Record<string, any>>(
  original: T,
  updated: Partial<T>,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(updated).filter(
      ([key, value]) => value !== original[key as keyof T],
    ),
  ) as Partial<T>;
}
