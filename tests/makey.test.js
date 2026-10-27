import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MAKEY_PARTS, MAKEY_STEPS, canPlay } from "../src/makey-lesson.js";
import { MAKEY_TOUR_STEPS } from "../src/app-tour.js";
import { normalizeProgress, normalizeLesson } from "../server/auth-utils.js";
import { loopPath } from "../src/makey-diagram.js";
test("virtual fruit keys need EARTH and the final step; real keyboard input stays gated to the final step", () => {
  assert.equal(canPlay({step:5,mode:"virtual",earth:false}),false);
  assert.equal(canPlay({step:5,mode:"virtual",earth:true}),true);
  assert.equal(canPlay({step:4,mode:"virtual",earth:true}),false);
  assert.equal(canPlay({step:5,mode:"real",earth:false}),true);
  assert.equal(canPlay({step:-1,mode:"real",earth:true}),false);
  assert.notEqual(loopPath(0),loopPath(1));
  assert.notEqual(loopPath(1),loopPath(2));
  assert.ok(!loopPath(0,true).includes("420"), "direct SPACE experiment has no fruit lead");
});
test("lessons accept only their own parts and reject arbitrary lesson IDs", () => {
  assert.equal(normalizeLesson("fruit-piano"),"fruit-piano");
  assert.throws(()=>normalizeLesson("other-profile"),/Invalid progress/);
  const input={found:["clips","fruit","breadboard"],completed:[-1,5,6],step:5};
  assert.deepEqual(normalizeProgress(input,"fruit-piano").found,["clips","fruit"]);
  assert.deepEqual(normalizeProgress(input).found,["breadboard"]);
  assert.equal(MAKEY_STEPS.length,7);
  assert.equal(MAKEY_PARTS.length,6);
});
test("the Fruit Piano tour covers every declared feature with an existing target", () => {
  const html=readFileSync(new URL("../learn/makey-makey/index.html",import.meta.url),"utf8");
  const features=[...html.matchAll(/data-tour-feature="([^"]+)"/g)].map(match=>match[1]);
  for(const feature of features) assert.ok(MAKEY_TOUR_STEPS.some(step=>step.feature===feature),feature);
  for(const step of MAKEY_TOUR_STEPS){assert.ok(html.includes(`id="${step.target.slice(1)}"`));assert.ok(step.description && step.title);}
});
