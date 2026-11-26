// The cloud functions already decide this for themselves: isWorthReporting in
// firebase-functions/functions/sentry.js drops the HttpsError codes that mean the
// caller got it wrong, so a signed-out user or a refused permission never files an
// issue from the server. The browser receives the very same error and, without the
// same check, files it instead - which is how "Not allowed to regenerate this record."
// ended up in Sentry as an error rather than as a message to the person who hit it.
// Keep this list in step with the server's.
const callerFaultCodes = new Set([
  "unauthenticated",
  "permission-denied",
  "invalid-argument",
  "not-found",
  "already-exists",
  "failed-precondition",
  "out-of-range",
  "unimplemented",
  "cancelled",
]);

// The callables SDK namespaces the code it hands back, so a function that threw
// HttpsError("permission-denied") surfaces here as "functions/permission-denied".
export const isCallerFault = (error) =>
  callerFaultCodes.has(String(error?.code ?? "").replace(/^functions\//, ""));
