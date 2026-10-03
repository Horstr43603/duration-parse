import { test } from "node:test";
import assert from "node:assert/strict";
import { parse, format } from "../src/core.js";

test("parse: empty string is 0", () => {
  assert.equal(parse(""), 0);
});

test("parse: whitespace-only is 0", () => {
  assert.equal(parse("   \t\n"), 0);
});

test("parse: single millisecond unit", () => {
  assert.equal(parse("500ms"), 500);
});

test("parse: seconds", () => {
  assert.equal(parse("90s"), 90_000);
});

test("parse: mixed hours and minutes", () => {
  assert.equal(parse("2h30m"), 2 * 3_600_000 + 30 * 60_000);
});

test("parse: all five units in descending order", () => {
  assert.equal(parse("1d2h3m4s5ms"), 86_400_000 + 7_200_000 + 180_000 + 4_000 + 5);
});

test("parse: case-insensitive", () => {
  assert.equal(parse("2H30M"), 2 * 3_600_000 + 30 * 60_000);
});

test("parse: accepts PT prefix (ISO time subset)", () => {
  assert.equal(parse("PT2H30M"), 2 * 3_600_000 + 30 * 60_000);
});

test("parse: PT prefix with lowercase body", () => {
  assert.equal(parse("PT2h30m"), 2 * 3_600_000 + 30 * 60_000);
});

test("parse: rejects standalone P (date fields unsupported)", () => {
  assert.throws(() => parse("P1Y"), /Unsupported ISO-8601 duration/);
});

test("parse: rejects unrecognised unit", () => {
  assert.throws(() => parse("2y"), /Unexpected characters/);
});

test("parse: rejects duplicate unit", () => {
  assert.throws(() => parse("2h30m10m"), /Duplicate unit m/);
});

test("parse: rejects garbage between tokens", () => {
  assert.throws(() => parse("2h garbage 30m"), /Unexpected characters/);
});

test("parse: rejects trailing garbage", () => {
  assert.throws(() => parse("2h30m!"), /Unexpected characters/);
});

test("parse: rejects non-string input", () => {
  assert.throws(() => parse(123), /Expected a string/);
  assert.throws(() => parse(null), /Expected a string/);
});

test("format: zero is 0ms", () => {
  assert.equal(format(0), "0ms");
});

test("format: single millisecond", () => {
  assert.equal(format(5), "5ms");
});

test("format: seconds only", () => {
  assert.equal(format(90_000), "1m30s");
});

test("format: hours and minutes", () => {
  assert.equal(format(2 * 3_600_000 + 30 * 60_000), "2h30m");
});

test("format: days rolls over at 24h", () => {
  assert.equal(format(86_400_000 + 3_600_000), "1d1h");
});

test("format: omits zero middle units", () => {
  assert.equal(format(2 * 3_600_000 + 30_000), "2h30s");
});

test("format: floors fractional milliseconds", () => {
  assert.equal(format(1500.7), "1s500ms");
});

test("format: rejects negative input", () => {
  assert.throws(() => format(-1), /Expected a finite non-negative number/);
});

test("format: rejects NaN and Infinity", () => {
  assert.throws(() => format(NaN), /Expected a finite non-negative number/);
  assert.throws(() => format(Infinity), /Expected a finite non-negative number/);
});

test("round-trip: parse(format(x)) == x for clean values", () => {
  for (const v of [0, 500, 90_000, 2 * 3_600_000 + 30 * 60_000, 86_400_000 + 3_600_000]) {
    assert.equal(parse(format(v)), v);
  }
});
