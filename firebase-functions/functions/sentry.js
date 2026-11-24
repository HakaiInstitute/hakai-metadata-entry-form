const { logger } = require("firebase-functions/v2");
const { HttpsError } = require("firebase-functions/v2/https");

// Cloud Functions freezes the instance as soon as a handler settles, so anything the
// transport has not yet sent is lost. Every reporting path below flushes before it
// returns or rethrows.
const FLUSH_TIMEOUT_MS = 2000;

const dsn = process.env.SENTRY_DSN;

if (!dsn) {
  logger.warn(
    "SENTRY_DSN is not set - function errors will only reach Cloud Logging"
  );
}

let sentry = null;

// require("@sentry/node") costs ~900ms because it pulls in OpenTelemetry, and that
// would land on every cold start of all 17 functions. Errors are the rare path, so
// load it on the first one instead. After that the module cache keeps it warm for the
// life of the instance.
function getSentry() {
  if (!dsn) return null;
  if (!sentry) {
    sentry = require("@sentry/node");
    sentry.init({
      dsn,
      // Deploys use the same code against the production and development projects,
      // so this is what separates their issues in Sentry.
      environment:
        process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "unknown",
      // Errors only. Tracing would bill a span for every invocation of the functions
      // that run on database writes, and nothing here is under latency investigation.
      tracesSampleRate: 0,
      // Loading this late means the auto-instrumentation would attach after the
      // libraries it patches are already in use. Nothing here depends on it - every
      // event is captured by hand - so skip it and the integrations built on it.
      skipOpenTelemetrySetup: true,
      defaultIntegrations: false,
      integrations: [
        sentry.dedupeIntegration(),
        // Follows .cause, so a wrapped HttpsError still shows the underlying failure.
        sentry.linkedErrorsIntegration(),
      ],
    });
  }
  return sentry;
}

// HttpsError doubles as ordinary control flow: an unauthenticated caller or a bad
// argument is the client getting it wrong, not something to wake anyone up for.
// Only the codes that mean the function itself failed are worth an alert.
const serverFaultCodes = new Set([
  "internal",
  "unknown",
  "data-loss",
  "unavailable",
  "deadline-exceeded",
  "resource-exhausted",
  "aborted",
]);

function isWorthReporting(error) {
  // Test for HttpsError specifically rather than for a string `code`. Node's own
  // system errors carry one too, so a bare `code` check would file ECONNREFUSED from
  // the record generator under "the caller's fault" and drop it.
  if (!(error instanceof HttpsError)) return true;
  return serverFaultCodes.has(error.code);
}

async function send(error, tags) {
  const Sentry = getSentry();
  if (!Sentry) return;
  Sentry.captureException(error, { tags });
  await Sentry.flush(FLUSH_TIMEOUT_MS);
}

// Report an error the caller is handling itself, so it never reaches withSentry.
// Does not rethrow.
async function reportError(error, tags = {}) {
  await send(error, tags);
}

// Wrap a cloud function handler so its failures reach Sentry. The error is always
// rethrown - this only observes, it never changes what the caller sees.
function withSentry(name, handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isWorthReporting(error)) {
        await send(error, { function: name });
      }
      throw error;
    }
  };
}

module.exports = { withSentry, reportError, isWorthReporting };
