import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { createStore } from "../server/store.js";
import handler from "../api/family.js";
async function request(
  action,
  token,
  body,
  origin = process.env.APP_ORIGIN,
  method = "POST",
) {
  const req = {
    method,
    url: "/api/family?action=" + action,
    headers: {
      origin,
      cookie: `ls_session=${token}`,
      "x-forwarded-for": "qa-" + suffix,
    },
    body,
  };
  let result;
  const res = {
    setHeader() {},
    end(raw) {
      result = { status: this.statusCode, ...JSON.parse(raw) };
    },
  };
  await handler(req, res);
  return result;
}
const sql = neon(process.env.DATABASE_URL),
  store = createStore(),
  suffix = randomUUID(),
  emailA = `qa-${suffix}@example.invalid`,
  emailB = `qa-b-${suffix}@example.invalid`;
let parentA, parentB;
try {
  const tokenA = await store.parentLink(emailA);
  [parentA] = await Promise.all([
    store.consumeParent(tokenA),
    store.consumeParent(tokenA),
  ]).then((results) => {
    assert.equal(results.filter(Boolean).length, 1);
    return results.filter(Boolean);
  });
  const tokenB = await store.parentLink(emailB);
  parentB = await store.consumeParent(tokenB);
  const kid = await store.addChild(parentA.user.id, "QA learner", "robot");
  assert.equal(
    await store.childLink(parentB.user.id, kid.id),
    null,
    "another parent cannot issue child links",
  );
  assert.equal(
    await store.updateChild(parentB.user.id, kid.id, "Intruder", "fox"),
    null,
  );
  const link = await store.childLink(parentA.user.id, kid.id);
  const attempts = await Promise.all(
    Array.from({ length: 5 }, () => store.consumeChild(link.code)),
  );
  assert.equal(
    attempts.filter(Boolean).length,
    1,
    "child links must be consumed atomically",
  );
  const login = attempts.find(Boolean);
  const session = await store.session(login.token);
  assert.equal(session.role, "kid");
  assert.equal(session.id, kid.id);
  assert.equal(
    (await request("add-child", login.token, { name: "Forbidden" })).status,
    403,
  );
  assert.equal(
    (await request("kid-link", parentB.token, { id: kid.id })).status,
    404,
  );
  assert.equal(
    (
      await request(
        "add-child",
        parentA.token,
        { name: "Blocked" },
        "https://untrusted.invalid",
      )
    ).status,
    403,
  );
  assert.equal(
    (await request("add-child", parentA.token, { name: "x".repeat(9000) }))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        "consume-kid-link",
        "",
        undefined,
        process.env.APP_ORIGIN,
        "GET",
      )
    ).status,
    401,
  );
  const initial = await store.saveProgress(
    kid.id,
    { step: 1, speed: 500, found: ["board"], completed: [-1, 0] },
    0,
  );
  assert.equal(initial.generation, 0);
  const merged = await store.saveProgress(
    kid.id,
    { step: 2, found: ["led"], completed: [1] },
    0,
  );
  assert.deepEqual(new Set(merged.state.completed), new Set([-1, 0, 1]));
  assert.deepEqual(new Set(merged.state.found), new Set(["board", "led"]));
  const reset = await store.saveProgress(
    kid.id,
    { step: -1, completed: [], found: [] },
    0,
    true,
  );
  assert.equal(reset.generation, 1);
  assert.equal(
    await store.saveProgress(kid.id, { step: 5, completed: [5] }, 0),
    null,
    "stale devices cannot undo a reset",
  );
  const expired = await store.childLink(parentA.user.id, kid.id);
  await sql`UPDATE ls_kid_links SET expires_at=now()-interval '1 second' WHERE kid_id=${kid.id}`;
  assert.equal(await store.consumeChild(expired.code), null);
  await store.revokeChild(parentA.user.id, kid.id);
  assert.equal(await store.session(login.token), null);
  const limits = await Promise.all(
    Array.from({ length: 5 }, () => store.limit("qa-" + suffix, 3, 60000)),
  );
  assert.equal(limits.filter(Boolean).length, 3);
  console.log(
    "Database checks passed: atomic single use, expiry, parent isolation, profile revocation, progress merge/reset, and rate limits.",
  );
} finally {
  await sql`DELETE FROM ls_parents WHERE email IN(${emailA},${emailB})`;
  await sql`DELETE FROM ls_limits WHERE key=${"qa-" + suffix}`;
}
