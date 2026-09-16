import http from "node:http";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { serve } from "../src/main/server";
test("browser API requires its own origin and cookie; CLI uses a separate token", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-server-"));
  await fs.writeFile(path.join(dir, "index.html"), "<html>Tilt</html>");
  const server = await serve({
    ui: dir,
    scene: () => dir,
    modules: dir,
    token: "test-secret",
    command: async (c) => ({ type: c.type }),
  });
  try {
    const page = await fetch(server.origin);
    assert.equal(page.status, 200);
    const cookie = page.headers.get("set-cookie")!.split(";")[0];
    const send = (headers: Record<string, string>) =>
      fetch(server.origin + "/api", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ type: "state" }),
      });
    assert.equal((await send({})).status, 400);
    assert.equal(
      (await send({ Cookie: cookie, Origin: "https://untrusted.test" })).status,
      400,
    );
    assert.equal(
      (await send({ Cookie: cookie, Origin: server.origin })).status,
      200,
    );
    assert.equal(
      (await send({ Authorization: "Bearer test-secret" })).status,
      200,
    );
    const wrongHost = await new Promise<number | undefined>(
      (resolve, reject) => {
        http
          .get(
            server.origin,
            { headers: { Host: "untrusted.test" } },
            (response) => {
              response.resume();
              resolve(response.statusCode);
            },
          )
          .on("error", reject);
      },
    );
    assert.equal(wrongHost, 400);
    assert.equal(
      (
        await fetch(server.origin, {
          headers: { "Sec-Fetch-Site": "cross-site" },
        })
      ).status,
      400,
    );
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
