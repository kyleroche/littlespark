import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { newToken, hashToken } from "../server/auth-utils.js";
import { neon } from "@neondatabase/serverless";
import { createStore } from "../server/store.js";
import handler from "../api/family.js";
import { checkLabAccess } from "../server/lab-access.js";
async function request(
  action,
  token,
  body,
  origin = process.env.APP_ORIGIN,
  method = "POST",
  lesson = "first-circuit",
) {
  if (body && token && !Object.hasOwn(body, "profileId")) {
    body = { ...body, profileId: (await store.session(token))?.id };
  }
  const req = {
    method,
    url: "/api/family?action=" + action + "&lesson=" + lesson,
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
  assert.equal(
    await checkLabAccess(
      new Request("https://littlespark.tech/learn/", {
        headers: { cookie: `ls_session=${parentA.token}` },
      }),
    ),
    null,
  );
  const tokenB = await store.parentLink(emailB);
  parentB = await store.consumeParent(tokenB);
  assert.equal((await request("parent-permission",parentA.token,{parentPermission:false,privacyVersion:"2026-10-27"})).status,400);
  await store.parentPermission(parentA.user.id);
  await store.parentPermission(parentB.user.id);
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
    await checkLabAccess(
      new Request("https://littlespark.tech/learn/index.html", {
        headers: { cookie: `ls_session=${login.token}` },
      }),
    ),
    null,
  );
  const sibling = await store.addChild(parentA.user.id, "QA sibling", "fox");
  const siblingLink = await store.childLink(parentA.user.id, sibling.id);
  const siblingLogin = await store.consumeChild(siblingLink.code);
  const wrongProfile = await request("save-progress", siblingLogin.token, {
    profileId: kid.id,
    state: { step: 5, completed: [5] },
    generation: 0,
  });
  assert.equal(
    wrongProfile.status,
    409,
    "a stale tab cannot write to a different signed-in child",
  );
  assert.equal(wrongProfile.code, "SESSION_CHANGED");
  assert.equal((await store.progress(sibling.id)).state, null);
  assert.equal(
    (
      await request("add-child", parentB.token, {
        profileId: parentA.user.id,
        name: "Wrong family",
      })
    ).status,
    409,
  );
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
  // Second-lesson saves and resets must never change Blink state or generation.
  const blinkBefore = await store.progress(kid.id);
  const makeySaved = await request("save-progress", login.token,
    {state:{step:5,completed:[-1,0,1,2,3,4,5],found:["clips","fruit"]},generation:0},
    process.env.APP_ORIGIN,"POST","fruit-piano");
  assert.equal(makeySaved.status,200);
  assert.deepEqual(makeySaved.progress.state.found,["clips","fruit"]);
  const makeyRead = await request("me",login.token,undefined,process.env.APP_ORIGIN,"GET","fruit-piano");
  assert.equal(makeyRead.progress.state.completed.length,7);
  assert.deepEqual(await store.progress(kid.id),blinkBefore);
  const makeyReset=await store.saveProgress(kid.id,{step:-1,completed:[],found:[]},0,true,"fruit-piano");
  assert.equal(makeyReset.generation,1);
  assert.equal(await store.saveProgress(kid.id,{completed:[5]},0,false,"fruit-piano"),null);
  assert.deepEqual(await store.progress(kid.id),blinkBefore);
  const trafficSaved = await request("save-progress",login.token,{state:{step:5,completed:[-1,0,1],found:["led","resistor"]},generation:0},process.env.APP_ORIGIN,"POST","traffic-lights");
  assert.equal(trafficSaved.status,200);
  const trafficRead=await request("me",login.token,undefined,process.env.APP_ORIGIN,"GET","traffic-lights");
  assert.equal(trafficRead.progress.state.completed.length,3);
  assert.deepEqual(await store.progress(kid.id),blinkBefore);
  assert.equal((await store.progress(kid.id,"fruit-piano")).generation,1);
  await store.saveProgress(kid.id,{step:-1},0,true,"traffic-lights");
  assert.equal((await store.progress(kid.id,"fruit-piano")).generation,1);
  assert.deepEqual(await store.progress(kid.id),blinkBefore);
  for(const lesson of ["conductivity","button-light","game-controller"]){
    const state=lesson==="conductivity"?{step:5,completed:[5],experiments:{foil:{prediction:"no",result:"key",mode:"virtual"}}}:lesson==="game-controller"?{step:5,game:{x:2,y:3,collected:[2]}}:{step:5,speed:250};
    const saved=await request("save-progress",login.token,{state,generation:0},process.env.APP_ORIGIN,"POST",lesson);assert.equal(saved.status,200);
    const loaded=await request("me",login.token,undefined,process.env.APP_ORIGIN,"GET",lesson);
    if(lesson==="conductivity")assert.equal(loaded.progress.state.experiments.foil.prediction,"no");
    if(lesson==="game-controller")assert.deepEqual(loaded.progress.state.game,{x:2,y:3,collected:[2]});
    if(lesson==="button-light")assert.equal(loaded.progress.state.speed,250);
  }
  const notebook=await store.progress(kid.id,"conductivity");
  await store.saveProgress(kid.id,{step:5,experiments:{plastic:{prediction:"yes",result:"none",mode:"real"}}},0,false,"conductivity");
  assert.equal(Object.keys((await store.progress(kid.id,"conductivity")).state.experiments).length,2);
  await store.saveProgress(kid.id,{step:-1},0,true,"conductivity");
  assert.equal(await store.saveProgress(kid.id,notebook.state,0,false,"conductivity"),null);
  assert.deepEqual((await store.progress(kid.id,"game-controller")).state.game,{x:2,y:3,collected:[2]});
  assert.deepEqual(await store.progress(kid.id),blinkBefore);
  const badLesson = await request("me",login.token,undefined,process.env.APP_ORIGIN,"GET","unknown");
  assert.equal(badLesson.status,400);
  const expired = await store.childLink(parentA.user.id, kid.id);
  await sql`UPDATE ls_kid_links SET expires_at=now()-interval '1 second' WHERE kid_id=${kid.id}`;
  assert.equal(await store.consumeChild(expired.code), null);
  await store.revokeChild(parentA.user.id, kid.id);
  assert.equal(await store.session(login.token), null);
  assert.equal(
    (
      await checkLabAccess(
        new Request("https://littlespark.tech/learn/", {
          headers: { cookie: `ls_session=${login.token}` },
        }),
      )
    ).status,
    302,
  );
  // Deliberately commit a child session after revocation's statement snapshot.
  // A row deletion alone misses that session; the auth version must reject it.
  const raceKid=await store.addChild(parentA.user.id,"Revocation fixture","robot");
  const raceLink=await store.childLink(parentA.user.id,raceKid.id),raceToken=newToken();
  const consuming=sql`WITH consumed AS(UPDATE ls_kid_links l SET used_at=now() FROM ls_kids k WHERE l.hash=${hashToken(raceLink.code)} AND l.kid_id=k.id AND k.active=true AND l.auth_version=k.auth_version AND l.used_at IS NULL AND l.expires_at>now() RETURNING l.kid_id,l.auth_version), issued AS(INSERT INTO ls_sessions(hash,kid_id,auth_version,expires_at) SELECT ${hashToken(raceToken)},kid_id,auth_version,now()+interval '7 days' FROM consumed RETURNING kid_id) SELECT pg_sleep(0.8) FROM issued`.then(rows=>rows);
  await new Promise(resolve=>setTimeout(resolve,100));
  const [issued]=await Promise.all([consuming,store.revokeChild(parentA.user.id,raceKid.id)]);
  assert.equal(issued.length,1,"the overlapping login actually issued a session");
  assert.equal(await store.session(raceToken),null,"a concurrently issued session must be revoked");
  const staleCode="otter-robot-abc234";
  await sql`INSERT INTO ls_kid_links(kid_id,hash,auth_version,expires_at) VALUES(${raceKid.id},${hashToken(staleCode)},0,now()+interval '5 minutes')`;
  assert.equal(await store.consumeChild(staleCode),null,"a stale link surviving a race must not sign in");
  const newLink=await store.childLink(parentA.user.id,raceKid.id);
  const newLogin=await store.consumeChild(newLink.code);
  assert.ok(await store.session(newLogin.token),"a fresh post-revocation link must work");
  const limits = await Promise.all(
    Array.from({ length: 5 }, () => store.limit("qa-" + suffix, 3, 60000)),
  );
  assert.equal(limits.filter(Boolean).length, 3);
  // Privacy controls operate only on disposable families created above.
  assert.equal((await request("export-family",login.token,{})).status,401);
  const kidExport=await request("export-family",siblingLogin.token,{});assert.equal(kidExport.status,403);
  const permission=await request("parent-permission",parentA.token,{parentPermission:true,privacyVersion:"2026-10-27"});assert.equal(permission.status,200);
  const exported=await request("export-family",parentA.token,{});assert.equal(exported.status,200);
  assert.equal(exported.data.parent.email,emailA);
  assert.ok(exported.data.children.every(k=>k.id!==parentB.user.id));
  assert.ok(!JSON.stringify(exported.data).includes("auth_version"));
  assert.ok(!JSON.stringify(exported.data).includes(login.token));
  await sql`UPDATE ls_sessions SET created_at=now()-interval '16 minutes' WHERE parent_id=${parentA.user.id}`;
  assert.equal((await request("export-family",parentA.token,{})).status,403);
  await sql`UPDATE ls_sessions SET created_at=now() WHERE parent_id=${parentA.user.id}`;
  const privacyKid=await store.addChild(parentA.user.id,"Delete fixture","robot");
  await store.saveProgress(privacyKid.id,{step:3});
  const privacyLink=await store.childLink(parentA.user.id,privacyKid.id),privacyLogin=await store.consumeChild(privacyLink.code);
  assert.equal((await request("delete-child",parentB.token,{id:privacyKid.id,confirmName:"Delete fixture"})).status,404);
  assert.equal((await request("delete-child",parentA.token,{id:privacyKid.id,confirmName:"Wrong"})).status,404);
  assert.equal((await request("delete-child",parentA.token,{id:privacyKid.id,confirmName:"Delete fixture"})).status,200);
  assert.equal(await store.session(privacyLogin.token),null);
  assert.equal((await sql`SELECT count(*)::int AS n FROM ls_progress WHERE kid_id=${privacyKid.id}`)[0].n,0);
  assert.equal((await sql`SELECT count(*)::int AS n FROM ls_deletions WHERE subject_id=${privacyKid.id}`)[0].n,1);
  await sql`DELETE FROM ls_deletions WHERE subject_id=${privacyKid.id}`;
  const familyKid=await store.addChild(parentB.user.id,"Family deletion fixture","fox");
  const familyLink=await store.childLink(parentB.user.id,familyKid.id),familyLogin=await store.consumeChild(familyLink.code);
  assert.equal((await request("delete-family",parentA.token,{confirmEmail:emailB,confirmDelete:"DELETE"})).status,400);
  assert.equal((await request("delete-family",parentB.token,{confirmEmail:emailB,confirmDelete:"wrong"})).status,400);
  assert.equal((await request("delete-family",parentB.token,{confirmEmail:emailB,confirmDelete:"DELETE"})).status,200);
  assert.equal(await store.session(parentB.token),null);assert.equal(await store.session(familyLogin.token),null);
  assert.equal((await sql`SELECT count(*)::int AS n FROM ls_parent_links WHERE email=${emailB}`)[0].n,0);
  await sql`DELETE FROM ls_deletions WHERE subject_id=${parentB.user.id}`;
  console.log(
    "Database checks passed: atomic single use, expiry, parent isolation, profile revocation, progress merge/reset, and rate limits.",
  );
} finally {
  await sql`DELETE FROM ls_parents WHERE email IN(${emailA},${emailB})`;
  await sql`DELETE FROM ls_parent_links WHERE email IN(${emailA},${emailB})`;
  await sql`DELETE FROM ls_limits WHERE key=${"qa-" + suffix}`;
}
