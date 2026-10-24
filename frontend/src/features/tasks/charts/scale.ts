/** Smallest "nice" axis maximum (1, 2, 5 x 10^n) at or above `value`; at least 1. */
export function niceCeil(value: number): number {
  if (value <= 1) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude
  }
  return 10 * magnitude
}

/** `part` as a whole-number percentage of `total`; 0 when there is no total. */
export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

/** Parses a `YYYY-MM-DD` API date as a local calendar date (no UTC shift). */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}
