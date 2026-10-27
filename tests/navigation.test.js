import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { orbitView, panView, zoomView } from "../src/view-controls.js";
import { TOUR_STEPS, assertTourCoverage } from "../src/app-tour.js";
const fresh = () => ({
  x: 10,
  y: 0,
  z: 20,
  scale: 100,
  azimuth: 0,
  elevation: Math.PI / 4,
});
test("rotation changes yaw and pitch while keeping the camera above the workbench", () => {
  const view = fresh();
  orbitView(view, 50, 20);
  assert.notEqual(view.azimuth, 0);
  assert.ok(view.elevation > Math.PI / 4);
  orbitView(view, 0, 10000);
  assert.equal(view.elevation, 1.42);
  orbitView(view, 0, -10000);
  assert.equal(view.elevation, 0.18);
});
test("pan follows the camera orientation and reverses without moving components", () => {
  const view = fresh();
  panView(view, 50, 20, 400);
  assert.ok(view.x < 10 && view.z < 20);
  panView(view, -50, -20, 400);
  assert.ok(Math.abs(view.x - 10) < 1e-9 && Math.abs(view.z - 20) < 1e-9);
  const rotated = fresh();
  rotated.azimuth = Math.PI / 2;
  panView(rotated, 50, 0, 400);
  assert.ok(Math.abs(rotated.x - 10) < 1e-9);
  assert.ok(rotated.z > 20);
});
test("zoom stays usable at both extremes", () => {
  const view = fresh();
  zoomView(view, 0.5);
  assert.equal(view.scale, 50);
  zoomView(view, 0.0001);
  assert.equal(view.scale, 12);
  zoomView(view, 1000);
  assert.equal(view.scale, 320);
});
test("every user-facing feature declared in the UI has a tutorial and all tour targets exist", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const features = new Set(
    [...html.matchAll(/data-tour-feature="([^"]+)"/g)].map((match) => match[1]),
  );
  assert.ok(features.size >= 7);
  assertTourCoverage(features);
  for (const step of TOUR_STEPS) {
    assert.ok(features.has(step.feature), `Undeclared feature ${step.feature}`);
    assert.ok(step.target.startsWith("#"));
    assert.ok(
      html.includes(`id="${step.target.slice(1)}"`),
      `Missing target ${step.target}`,
    );
    assert.ok(step.description && step.detail && step.action);
  }
  assert.equal(
    new Set(TOUR_STEPS.map((step) => step.id)).size,
    TOUR_STEPS.length,
  );
  assert.throws(
    () => assertTourCoverage(new Set([...features, "new-unexplained-feature"])),
    /new-unexplained-feature/,
  );
});
