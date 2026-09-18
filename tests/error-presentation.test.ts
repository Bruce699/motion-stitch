import { test } from "node:test";
import assert from "node:assert/strict";
import { presentError } from "../src/core/error-presentation";

test("invalid JSON has a short summary and preserves full diagnostics", () => {
  const raw = `Error invoking remote method 'tilt:command': Error: SyntaxError: Unexpected token 'T', "The deploy"... is not valid JSON\n${"response ".repeat(200)}`;
  assert.equal(presentError(raw).title, "Couldn’t read the response");
  assert.equal(presentError(raw).details, raw);
  assert.equal(presentError(raw).summary, null);
});
test("transport errors suggest recovery without exposing wrappers", () => {
  assert.equal(
    presentError("TypeError: Failed to fetch").title,
    "Connection interrupted",
  );
  assert.equal(
    presentError(
      "Error invoking remote method 'tilt:command': Error: Scene missing\nstack",
    ).summary,
    "Scene missing",
  );
});
test("unknown diagnostics are bounded only in the summary", () => {
  const raw = "Error: " + "x".repeat(2000);
  assert.equal(presentError(raw).summary?.length, 240);
  assert.equal(presentError(raw).details, raw);
});
