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
    const unauthorized = await send({});
    assert.equal(unauthorized.status, 401);
    assert.equal((await unauthorized.json()).code, "UNAUTHORIZED");
    assert.equal(
      (await send({ Cookie: cookie, Origin: "https://untrusted.test" })).status,
      401,
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

test("named viewer routes keep cookies, modules and events on their own origin", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "tilt-route-"));
  await fs.writeFile(path.join(dir, "index.html"), "<html>Tilt</html>");
  await fs.writeFile(path.join(dir, "scene.js"), "export default {};");
  const server = await serve({
    ui: dir,
    scene: () => dir,
    modules: dir,
    token: "test-secret",
    publicOrigin: "http://tilt.localhost",
    command: async (c) => ({ type: c.type }),
  });
  const request = (
    pathname: string,
    headers: Record<string, string> = {},
    method = "GET",
  ) =>
    new Promise<{ status: number; cookie?: string; body: string }>(
      (resolve, reject) => {
        const req = http.request(
          server.origin + pathname,
          { method, headers },
          (res) => {
            let body = "";
            res.on("data", (chunk) => {
              body += chunk;
              // One event proves the connection streams instead of buffering.
              if (res.headers["content-type"] === "text/event-stream") {
                resolve({ status: res.statusCode!, body });
                res.destroy();
              }
            });
            res.on("end", () =>
              resolve({
                status: res.statusCode!,
                body,
                cookie: res.headers["set-cookie"]?.[0].split(";")[0],
              }),
            );
          },
        );
        req.on("error", reject);
        req.end(
          method === "POST" ? JSON.stringify({ type: "state" }) : undefined,
        );
      },
    );
  try {
    const named = { Host: "tilt.localhost" };
    const page = await request("/", named);
    assert.equal(page.status, 200);
    const authenticated = {
      ...named,
      Cookie: page.cookie!,
      Origin: server.publicOrigin,
    };
    assert.equal(
      (await request("/modules/scene.js", authenticated)).status,
      200,
    );
    const post = { ...authenticated, "Content-Type": "application/json" };
    assert.equal((await request("/api", post, "POST")).status, 200);
    for (const origin of [
      server.origin,
      "http://other.localhost",
      "https://untrusted.test",
    ]) {
      assert.equal(
        (await request("/api", { ...post, Origin: origin }, "POST")).status,
        401,
      );
    }
    assert.equal(
      (
        await request(
          "/api",
          { ...post, "Sec-Fetch-Site": "cross-site" },
          "POST",
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await request(
          "/api",
          {
            ...post,
            Host: new URL(server.origin).host,
          },
          "POST",
        )
      ).status,
      401,
    );
    const events = await request("/events?viewId=route-test", authenticated);
    assert.equal(events.status, 200);
    assert.match(events.body, /event: connected/);
    assert.equal(
      (
        await request("/events?viewId=route-test", {
          ...authenticated,
          Origin: "http://other.localhost",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await request("/", {
          Host: "untrusted.test",
          "X-Forwarded-Host": "tilt.localhost",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/api",
          {
            Authorization: "Bearer test-secret",
            "Content-Type": "application/json",
          },
          "POST",
        )
      ).status,
      200,
    );
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("a routed runtime fails on a busy assigned port instead of moving behind the proxy", async () => {
  const options = {
    ui: ".",
    scene: () => ".",
    modules: ".",
    token: "test",
    command: async () => null,
  };
  const first = await serve(options);
  try {
    await assert.rejects(
      serve({
        ...options,
        port: Number(new URL(first.origin).port),
        strictPort: true,
      }),
      { code: "EADDRINUSE" },
    );
  } finally {
    first.close();
  }
});
