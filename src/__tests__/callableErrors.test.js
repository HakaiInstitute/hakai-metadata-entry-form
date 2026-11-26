import { isCallerFault } from "../utils/callableErrors";

describe("isCallerFault", () => {
  // What the browser actually receives: the callables SDK namespaces the code, so a
  // function that threw HttpsError("permission-denied") arrives like this. Matching
  // the bare code alone would let every one of these through.
  it.each([
    "functions/permission-denied",
    "functions/unauthenticated",
    "functions/invalid-argument",
    "functions/not-found",
    "functions/already-exists",
    "functions/failed-precondition",
    "functions/out-of-range",
    "functions/unimplemented",
    "functions/cancelled",
  ])("treats %s as the caller's fault", (code) => {
    expect(isCallerFault({ code })).toBe(true);
  });

  it("accepts the bare code too", () => {
    expect(isCallerFault({ code: "permission-denied" })).toBe(true);
  });

  // These are the ones worth reporting - they mean the function itself broke. This is
  // the same split isWorthReporting makes in firebase-functions/functions/sentry.js.
  it.each([
    "functions/internal",
    "functions/unknown",
    "functions/data-loss",
    "functions/unavailable",
    "functions/deadline-exceeded",
    "functions/resource-exhausted",
    "functions/aborted",
  ])("does not excuse %s", (code) => {
    expect(isCallerFault({ code })).toBe(false);
  });

  it("does not excuse an error with no code at all", () => {
    // -78 and -AA both arrived frameless; an error that carries nothing usable must
    // not be silently swallowed as though the caller had asked for it.
    expect(isCallerFault(new Error("boom"))).toBe(false);
    expect(isCallerFault({})).toBe(false);
    expect(isCallerFault(undefined)).toBe(false);
    expect(isCallerFault(null)).toBe(false);
  });

  it("does not match on a prefix or a substring", () => {
    expect(isCallerFault({ code: "permission-denied-ish" })).toBe(false);
    expect(isCallerFault({ code: "other/permission-denied" })).toBe(false);
  });
});
