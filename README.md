# Duration Parse

Parse strings like `"2h30m"` into milliseconds and format millisecond counts back into compact human strings. Zero dependencies, ESM only.

```js
import { parse, format } from "duration-parse";

const ms = parse("2h30m");      // 9_000_000
const s = format(9_000_000);    // "2h30m"
```

## Why this exists

Durations show up in CLI flags, config files, and logs, and every project that needs them tends to grow its own half-broken parser. This library is the small, exact version: five fixed units, one regex, no calendar. The trade-off is that it cannot represent months or years — those aren't a fixed number of milliseconds, so supporting them would mean lying or pulling in a clock, and this library does neither.

Supported units: `ms` (1), `s` (1000), `m` (60 000), `h` (3 600 000), `d` (86 400 000). Input is case-insensitive and may carry an ISO-8601 `PT` prefix (`PT2H30M`); a bare `P` (the ISO date marker) is rejected, because date fields are not handled.

## The awkward edge

A `P` prefix without a `T` is the ISO marker for calendar fields (`P1Y` = one year). This library throws on it rather than guessing how many days a year contains. If you need calendar durations, this is the wrong tool.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

