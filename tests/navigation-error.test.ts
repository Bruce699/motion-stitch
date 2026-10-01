import { test } from "node:test";
import assert from "node:assert/strict";
import { navigationErrorPage } from "../src/main/navigation-error";

test("document recovery escapes diagnostics instead of executing their markup", () => {
  const page = navigationErrorPage(
    '<script>alert("secret")</script>&',
    "test-nonce",
  );
  assert.doesNotMatch(page, /<script>alert/);
  assert.match(
    page,
    /&lt;script&gt;alert\(&quot;secret&quot;\)&lt;\/script&gt;&amp;/,
  );
  assert.match(page, /nonce="test-nonce"/);
});
