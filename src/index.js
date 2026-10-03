/**
 * Duration Parse — convert "2h30m" into milliseconds and back into human strings.
 *
 * Re-exports the public surface so callers depend on the package root, not on
 * internal module paths. Keeping `index.js` as a thin façade means the internal
 * split between parsing and formatting can change without breaking consumers.
 */

import { parse, format } from "./core.js";

export { parse, format };
