import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseHex, verifyTraffic } from "../src/firmware.js";
import { trafficSource, TRAFFIC_CONNECTIONS } from "../src/arduino-lessons.js";
import { arduinoTour } from "../src/app-tour.js";
import { normalizeLesson } from "../server/auth-utils.js";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manifest=JSON.parse(read("public/firmware/manifest.json"));
for(const speed of [250,500,1000]) test(`compiled traffic program at ${speed}ms checks repeated order, exclusive outputs and waits`,()=>{
  const record=manifest.traffic[speed],text=read("public"+record.path);
  assert.equal(createHash("sha256").update(text).digest("hex"),record.sha256);
  assert.equal(read(`public/firmware/traffic-${speed}.ino`),trafficSource(speed));
  assert.deepEqual(verifyTraffic(parseHex(text),speed),{passed:true,phases:7});
});
test("overlapping outputs in a real compiled program fail validation",()=>{
  assert.throws(()=>verifyTraffic(parseHex(read("tests/fixtures/traffic_overlap/traffic_overlap.hex")),500),/together/);
});
test("a mismatched pace and a one-LED program cannot pass Traffic Lights",()=>{
  assert.throws(()=>verifyTraffic(parseHex(read("public/firmware/traffic-250.hex")),500),/timing/);
  assert.throws(()=>verifyTraffic(parseHex(read("public/firmware/blink-250.hex")),250),/order/);
});
test("traffic wiring stays within the breadboard and its tour covers the route",()=>{
  assert.equal(normalizeLesson("traffic-lights"),"traffic-lights");
  assert.equal(new Set(TRAFFIC_CONNECTIONS.map(branch=>branch.pin)).size,3);
  for(const branch of TRAFFIC_CONNECTIONS){assert.ok(branch.column>=1 && branch.end<=30);assert.equal(branch.end-branch.column,6);}
  const html=read("learn/traffic-lights/index.html"),tour=arduinoTour(true);
  for(const match of html.matchAll(/data-tour-feature="([^"]+)"/g)) assert.ok(tour.some(step=>step.feature===match[1]),match[1]);
  for(const step of tour) assert.ok(html.includes(`id="${step.target.slice(1)}"`));
});
