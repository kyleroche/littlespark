import test from "node:test";
import assert from "node:assert/strict";
import {
  kidCode,
  WORDS,
  hashToken,
  newToken,
  readCookie,
  sessionCookie,
  normalizeProgress,
  normalizeName,
  rateKey,
  LINK_TTL_MS,
} from "../server/auth-utils.js";
test("kid codes use friendly words and a cryptographic suffix; tokens are hashed", () => {
  const codes = new Set();
  for (let i = 0; i < 1000; i++) {
    const code = kidCode(),
      [a, b, suffix] = code.split("-");
    assert.ok(WORDS.includes(a) && WORDS.includes(b));
    assert.notEqual(a, b);
    assert.match(suffix, /^[a-z2-9]{6}$/);
    assert.notEqual(hashToken(code), code);
    codes.add(code);
  }
  assert.equal(codes.size, 1000);
  assert.equal(LINK_TTL_MS, 300000);
  assert.match(newToken(), /^[A-Za-z0-9_-]{43}$/);
});
test("cookies are HTTP-only, host scoped, and secure in production", () => {
  const cookie = sessionCookie("value");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.ok(!cookie.includes("Domain="));
  assert.equal(readCookie("other=a; ls_session=abc; other2=b"), "abc");
  assert.equal(readCookie("other=abc"), null);
  assert.ok(!sessionCookie("value", { secure: false }).includes("Secure"));
});
test("progress accepts only known fields and bounded lesson values", () => {
  assert.deepEqual(
    normalizeProgress({
      step: 900,
      speed: 1,
      color: "javascript:",
      completed: [-1, 5, 5, 8, "admin"],
      found: ["board", "board", "unknown"],
      role: "parent",
    }),
    {
      step: -1,
      speed: 500,
      color: "#d25f4d",
      completed: [-1, 5],
      found: ["board"],
    },
  );
  assert.throws(() => normalizeProgress(null));
  assert.throws(() => normalizeProgress([]));
  assert.throws(() => normalizeName("<script>"));
  assert.throws(() => normalizeName("x".repeat(33)));
  assert.equal(normalizeName(" Alex "), "Alex");
});
test("rate-limit keys do not store raw IPs or email addresses", () => {
  assert.match(
    rateKey("person@example.com", "email", "test-secret"),
    /^[a-f0-9]{64}$/,
  );
  assert.notEqual(rateKey("a", "b", "one"), rateKey("a", "b", "two"));
});
