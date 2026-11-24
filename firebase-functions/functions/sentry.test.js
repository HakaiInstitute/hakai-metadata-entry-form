/**
 * Which failures page someone and which are ignored is the whole point of this
 * module, so it is worth pinning. Plain node, no runner: `npm test`.
 */
const assert = require("assert");
const { HttpsError } = require("firebase-functions/v2/https");

// No DSN, so nothing is actually sent and @sentry/node is never loaded.
delete process.env.SENTRY_DSN;
const { withSentry, isWorthReporting } = require("./sentry");

// HttpsError is how a handler tells the client it got the call wrong. Alerting on
// these would mean an alert every time someone hits a page while signed out.
const clientFaults = [
  "unauthenticated",
  "permission-denied",
  "invalid-argument",
  "not-found",
  "already-exists",
  "failed-precondition",
  "out-of-range",
  "unimplemented",
  "cancelled",
];
for (const code of clientFaults) {
  assert.strictEqual(
    isWorthReporting(new HttpsError(code, "x")),
    false,
    `${code} should not be reported`
  );
}

const serverFaults = [
  "internal",
  "unknown",
  "data-loss",
  "unavailable",
  "deadline-exceeded",
  "resource-exhausted",
  "aborted",
];
for (const code of serverFaults) {
  assert.strictEqual(
    isWorthReporting(new HttpsError(code, "x")),
    true,
    `${code} should be reported`
  );
}

// Node's own errors carry a string `code` as well, so these must not be mistaken for
// HttpsErrors and filtered out - a refused connection to the record generator is
// exactly what we want to hear about.
for (const code of ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"]) {
  const err = new Error(`connect ${code}`);
  err.code = code;
  assert.strictEqual(isWorthReporting(err), true, `${code} should be reported`);
}
assert.strictEqual(isWorthReporting(new Error("boom")), true);
assert.strictEqual(isWorthReporting(new TypeError("bad")), true);
assert.strictEqual(isWorthReporting(undefined), true);

// The wrapper observes; it must not change what the caller sees.
(async () => {
  assert.strictEqual(await withSentry("t", async (a, b) => a + b)(2, 3), 5);

  // updatesRecordUpdate and updatesRecordDelete hand in synchronous handlers
  assert.strictEqual(await withSentry("t", () => "value")(), "value");

  const sentinel = new HttpsError("internal", "kaboom");
  await assert.rejects(
    withSentry("t", async () => {
      throw sentinel;
    })(),
    (err) => err === sentinel,
    "must rethrow the identical error object"
  );

  console.log("sentry.test.js: all assertions passed");
})();
