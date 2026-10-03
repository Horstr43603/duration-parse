/**
 * Core parsing and formatting for ISO-8601-style duration shorthand.
 *
 * Design decisions, stated plainly:
 *
 * 1. Only the subset of ISO-8601 durations without dates and weeks is supported.
 *    Parsing `P1Y2M3D` requires a calendar (months are 28–31 days, years shift
 *    on leap seconds) and a timezone for `PT` forms mixing days and hours.
 *    Avoiding that keeps the library deterministic and dependency-free. A `PT`
 *    prefix is accepted, `P` alone is rejected, and calendar fields (Y, M before
 *    the `T`, W, D) are not recognised.
 *
 * 2. Units are fixed and exact: ms=1, s=1000, m=60_000, h=3_600_000,
 *    d=86_400_000. No month, no year. This is the one ambiguity the brief
 *    allows; the README calls it out so readers aren't surprised.
 *
 * 3. The bare shorthand ("2h30m") and the ISO time form ("PT2H30M") share one
 *    parser. The `T` separator is optional but mandatory between the (absent)
 *    date part and the time part; since there's no date part, accepting bare
 *    sequences is the least surprising choice.
 *
 * 4. Format precision is 1ms. Values smaller than 1ms round to "0ms".
 *
 * 5. Input is treated case-insensitively so "2H30M" and "2h30m" match.
 */

const UNITS = Object.freeze({
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
});

const TOKEN = /(\d+)(ms|s|m|h|d)/gi;

/**
 * Parse a duration shorthand string into milliseconds.
 *
 * Accepted forms: bare shorthand ("2h30m", "500ms", "90s") and the ISO-8601
 * time subset ("PT2H30M", "PT500MS"). Mixing a `P`/`PT` prefix with bare tokens
 * ("PT2h30m") is also accepted; the prefix is stripped and ignored.
 *
 * @param {string} input
 * @returns {number} milliseconds; 0 for empty/whitespace input.
 * @throws {Error} if the input contains unrecognised characters, repeated units,
 *    or an unsupported ISO-8601 field (Y, W, D outside `PT`).
 */
export function parse(input) {
  if (typeof input !== "string") {
    throw new Error(`Expected a string, got ${input === null ? "null" : typeof input}`);
  }
  const original = input;
  let s = input.trim();
  if (s.length === 0) return 0;

  // Strip an optional leading PT or P prefix. We only accept time fields, so a
  // standalone P (date-only) is rejected as unsupported, not silently dropped.
  const upperHead = s.toUpperCase();
  if (upperHead.startsWith("PT")) {
    s = s.slice(2);
  } else if (upperHead.startsWith("P")) {
    // A bare P is the ISO date marker; we don't support calendar fields.
    throw new Error(`Unsupported ISO-8601 duration (date fields not handled): ${JSON.stringify(original)}`);
  }

  TOKEN.lastIndex = 0;
  let total = 0;
  let lastEnd = 0;
  const seen = new Set();
  let match;

  while ((match = TOKEN.exec(s)) !== null) {
    if (match.index !== lastEnd) {
      // Garbage between tokens (or before the first) — reject rather than skip.
      throw new Error(`Unexpected characters in duration: ${JSON.stringify(original)}`);
    }
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (seen.has(unit)) {
      throw new Error(`Duplicate unit ${unit} in duration: ${JSON.stringify(original)}`);
    }
    seen.add(unit);
    total += value * UNITS[unit];
    lastEnd = match.index + match[0].length;
  }

  if (lastEnd !== s.length) {
    // Trailing garbage after the last consumed token.
    throw new Error(`Unexpected characters in duration: ${JSON.stringify(original)}`);
  }

  return total;
}

/**
 * Format a millisecond count as a compact duration string.
 *
 * Chooses the largest unit that fits and appends smaller units down to 1ms,
 * omitting zero-valued middle units ("1h30s", not "1h0m30s"). Zero is "0ms".
 *
 * @param {number} ms
 * @returns {string}
 * @throws {Error} if `ms` is not a finite, non-negative number.
 */
export function format(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) {
    throw new Error(`Expected a finite non-negative number, got ${String(ms)}`);
  }

  ms = Math.floor(ms);
  if (ms === 0) return "0ms";

  const parts = [];
  for (const [unit, size] of [
    ["d", UNITS.d],
    ["h", UNITS.h],
    ["m", UNITS.m],
    ["s", UNITS.s],
    ["ms", UNITS.ms],
  ]) {
    if (ms >= size) {
      const count = Math.floor(ms / size);
      parts.push(`${count}${unit}`);
      ms -= count * size;
    }
  }
  return parts.join("");
}
