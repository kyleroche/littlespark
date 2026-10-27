import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("home, lab, and magic-link routes remain distinct", () => {
  const home = read("index.html"),
    lab = read("learn/index.html"),
    config = JSON.parse(read("vercel.json"));
  assert.ok(home.includes('href="/learn/"'));
  assert.ok(home.includes('href="/learn/?signin=1"'));
  assert.ok(home.includes("https://littlespark.vtc.store"));
  assert.ok(lab.includes('id="account-button"'));
  assert.ok(!home.includes('id="account-button"'));
  for (const path of ["/login/:token", "/parent-login/:token"]) {
    assert.equal(
      config.rewrites.find((rule) => rule.source === path)?.destination,
      "/learn/index.html",
    );
  }
  assert.ok(
    read("src/accounts.js").includes(
      'history.replaceState(null, "", "/learn/")',
    ),
  );
});
