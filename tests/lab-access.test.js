import test from "node:test";
import assert from "node:assert/strict";
import { checkLabAccess } from "../server/lab-access.js";
const token = "a".repeat(43);
const request = (path = "/learn/", cookie = "", method = "GET") =>
  new Request("https://littlespark.tech" + path, {
    method,
    headers: { cookie },
  });
test("direct lab paths require a real session, including the HTML entry point", async () => {
  for (const path of [
    "/learn",
    "/learn/",
    "/learn/index.html",
    "/learn/conductivity/",
    "/learn/button-light/index.html",
    "/learn/game-controller/",
    "/learn/traffic-lights/",
    "/learn/traffic-lights/index.html",
    "/learn/makey-makey/",
    "/learn/makey-makey/index.html",
    "/learn/?signin=1",
  ]) {
    let queried = false;
    const result = await checkLabAccess(request(path), async () => {
      queried = true;
      return null;
    });
    assert.equal(result.status, 302);
    assert.equal(result.headers.get("Location"), "/signin/");
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
    assert.equal(queried, false);
  }
  const fake = await checkLabAccess(
    request("/learn/", "ls_session=" + token),
    async () => null,
  );
  assert.equal(fake.status, 302);
});
test("both parents and kids can enter, but forged or revoked sessions cannot", async () => {
  for (const role of ["parent", "kid"]) {
    assert.equal(
      await checkLabAccess(
        request("/learn/", "ls_session=" + token),
        async (supplied) => {
          assert.equal(supplied, token);
          return { role, id: "test" };
        },
      ),
      null,
    );
  }
  assert.equal(
    (
      await checkLabAccess(
        request("/learn/", "ls_session=" + token),
        async () => ({ role: "guest" }),
      )
    ).status,
    302,
  );
});
test("sign-in, magic links, home, gear assets, and API routes remain public", async () => {
  for (const path of [
    "/",
    "/signin/",
    "/how-to/",
    "/login/otter-robot-test",
    "/parent-login/test",
    "/images/blink-circuit.png",
    "/api/family?action=me",
  ]) {
    assert.equal(
      await checkLabAccess(request(path), async () => {
        throw Error("must not query");
      }),
      null,
    );
  }
});
test("auth-service failures fail closed and lab routes do not accept POST", async () => {
  const fail = await checkLabAccess(
    request("/learn/", "ls_session=" + token),
    async () => {
      throw Error("database unavailable");
    },
  );
  assert.equal(fail.status, 503);
  assert.ok(!(await fail.text()).includes("database unavailable"));
  assert.equal(
    (await checkLabAccess(request("/learn/", "", "POST"))).status,
    405,
  );
});
