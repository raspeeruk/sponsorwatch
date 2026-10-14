import assert from "node:assert/strict";
import { test } from "node:test";
import net from "node:net";
import { createServer } from "./serve.mjs";
import { getCompanyIndex, getTownIndex } from "../src/lib/data";

test("public requests serve retained files and unknown paths have no rendering fallback", async () => {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing local address");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("x-sponsorwatch-rendering"), "static-file");
    const cached = await fetch(base, { headers: { "If-None-Match": home.headers.get("etag")! } });
    assert.equal(cached.status, 304);
    const head = await fetch(base, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    for (const [kind, slug] of [["company", getCompanyIndex()[0].slug], ["town", getTownIndex()[0].slug]]) {
      const page = await fetch(`${base}/${kind}/${slug}`);
      assert.equal(page.status, 200);
      assert.equal(page.headers.get("content-encoding"), "gzip");
      assert.match(await page.text(), /<h1\b/);
      const identity = await fetch(`${base}/${kind}/${slug}`, { headers: { "Accept-Encoding": "gzip;q=0" } });
      assert.equal(identity.headers.get("content-encoding"), null);
      assert.match(await identity.text(), /<h1\b/);
    }
    assert.equal((await fetch(`${base}/company/this-sponsor-does-not-exist`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e%2fscripts/serve.mjs`)).status, 404);
    assert.equal((await fetch(`${base}/api/contact`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "name=Local+validation" })).status, 400);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("malformed raw URLs and aborted contact bodies do not stop the file server", async () => {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing local address");
  const port = address.port;
  const base = `http://127.0.0.1:${port}`;
  const raw = (request: string) => new Promise<string>((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => socket.write(request));
    let response = "";
    socket.setTimeout(3000, () => { socket.destroy(); reject(new Error("Raw request timed out")); });
    socket.on("data", data => response += data.toString());
    socket.on("end", () => { socket.setTimeout(0); socket.destroy(); resolve(response); });
    socket.on("error", reject);
  });
  try {
    const response = await raw("GET //[/ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
    assert.match(response, /^HTTP\/1\.1 400/);
    assert.equal((await fetch(base)).status, 200);

    const observedAbort = new Promise<void>(resolve => {
      server.once("request", request => request.once("aborted", resolve));
    });
    const socket = net.connect(port, "127.0.0.1");
    await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); });
    await new Promise<void>(resolve => socket.write("POST /api/contact HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: 1000\r\n\r\nname=Interrupted", () => resolve()));
    socket.end();
    await observedAbort;
    socket.destroy();
    assert.equal((await fetch(base)).status, 200);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
