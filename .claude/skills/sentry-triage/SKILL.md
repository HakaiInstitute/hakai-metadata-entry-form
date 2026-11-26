---
name: sentry-triage
description: Diagnose a Sentry issue in this repo end to end - work out which of the three tiers actually failed, pull the logs that hold the real cause, and skip the dead ends. Use for any Sentry issue here, and especially for "Could not regenerate the record files", "FirebaseError internal", a record generator 500, or any event whose stack trace stops at a wrapper.
---

# Triaging a Sentry issue in hakai-metadata-entry-form

Three separate programs report into one Sentry project, and the one that *shows*
the error is usually not the one that *caused* it. Most of the time lost on these
goes to reading the wrong tier's logs.

## The three tiers

All report to `hakai-institute/hakai-metadata-entry-form` (numeric id `5493983`).
Tell them apart by the event's `platform` tag.

| Tier | Code | platform | Where its logs live |
|---|---|---|---|
| React app | `src/` | `javascript` | Browser only; check the attached replay |
| Cloud Functions | `firebase-functions/functions/` | `node` | Firebase MCP `functions_get_logs` |
| Record generator (Flask) | `cioos-records-update/` | `python` | Portainer container logs |

The `environment` tag on a node event is the GCP project (`cioos-metadata-form` or
`cioos-metadata-form-dev`), set in `sentry.js` - not `production`/`staging`.

## Start here: is this a wrapper?

`regenerateXMLforRecord` catches generator failures and rethrows a generic
`HttpsError`, so Sentry shows **"Could not regenerate the record files."** with a
chained `Request failed with status code 500`. That pair means *the Python
generator failed* and tells you nothing about why. The same goes for a bare
`FirebaseError: internal`.

A wrapper event is a pointer, not a diagnosis. Go to the generator's logs.

One client-side issue and one server-side issue are usually filed for the same
failure (`-AF` and `-AE` in the Nov 2026 case). Read the **node** one - it carries
the chained cause. Note the event count under-reports reality - in the Nov 2026
case six generator 500s surfaced as two Sentry events - so use the container or
Cloud Logging entries to count occurrences, never the Sentry `occurrences` field.

## Reading the generator's logs (Portainer)

This is where the actual traceback lives.

```
EndpointList(select="[].{id:Id,name:Name,type:Type,status:Status}")
docker_proxy(environment_id=<id>, path="/containers/json",
             select="[].{id:Id,name:Names[0],state:State,image:Image}")
docker_proxy(environment_id=<id>, path="/containers/<container-id>/logs",
             query_params={"stdout":"true","stderr":"true","timestamps":"true",
                           "since":"<unix-ts>","tail":"400"})
```

The container is `metadata-generator-web`. Details that bite:

- Log output is **not JSON**, so `select` is silently ignored. Narrow with
  `since` / `tail` instead. `since` is a Unix timestamp, not RFC3339.
- `stdout` and/or `stderr` are mandatory; Docker 400s without them.
- Never pass `follow=true`.
- The body carries Docker's 8-byte stream-framing headers, so lines arrive with
  binary noise prefixed. Read through it; don't assume the log is corrupt.
- Everything is UTC and lines up with Sentry timestamps to the second.

> [!WARNING]
> Generator access-log lines contain `?...&token=<RECORD_API_TOKEN>`. Never paste
> a raw log line into a GitHub issue, PR, or commit message. Redact the query
> string and the Firebase user ID from the record path.

Expect a lot of scanner noise (Nuclei, `/.git/HEAD`, `/socket.io/`) in the proxy
container's logs. Filter to `/record` and `/recordDelete`.

## Reading the cloud function's logs (Firebase MCP)

```
functions_get_logs(function_names=["regenerateXMLforRecord"],
                   start_time="2026-11-26T12:55:00Z",
                   end_time="2026-11-26T13:50:00Z",
                   min_severity="ERROR", order="asc")
```

`callRecordGenerator` logs the generator's status and response body here. Useful
for confirming *that* the generator failed and ruling out network/auth, but the
body is often as generic as `{"error":"Error creating xml"}` - it will not name
the underlying exception. Only the container logs will.

If every call returns `401`, the stored Google credential is expired - see below.

## Which deploy is actually running

Do not infer this from the GitHub Actions status.

- The generator host runs `ghcr.io/hakaiinstitute/metadata-generator-web:sha-<7>`.
  Read the running tag off the `docker_proxy /containers/json` output and map the
  sha back to a commit. That is ground truth.
- `build-and-deplot-metadata-generator.yaml` pushes a *different* image name
  (`img-captain-metadata-generator-web`) and its CapRover deploy steps are
  disabled (`if: false`) after months of `Error: self signed certificate`. A green
  run on that workflow does **not** mean anything shipped.
- Sentry has no release tracking configured, so `suspectCommit` is always `null`.

## Environment gotchas

These cost real time; none are your change breaking.

**Firebase CLI** - the global `firebase-tools` (13.31.2) crashes on Node 26
(`buffer-equal-constant-time` reads the removed `SlowBuffer.prototype`). Use:

```
npm_config_cache=/tmp/npm-cache npx -y firebase-tools@latest <cmd>
```

The cache override is needed because `~/.npm/_cacache` has root-owned files.

**Firebase MCP 401** - means the stored token is expired, not that the server is
broken. `firebase_get_environment` keeps working because it only reads local
config. Fix with `npx -y firebase-tools@latest login --reauth` (the global binary
cannot do it - see above). No MCP reconnect needed afterwards; credentials are
read per call.

**Python tests** - `pytest` alone fails on a sandbox-blocked `.env`:

```
cd cioos-records-update
uv run --no-project --with pytest --with flask==3.0.3 --with werkzeug==3.0.3 \
  --with pyyaml python -m pytest ./test_app.py -q --ignore=.env -p no:cacheprovider
```

**Cloud function tests** - `npm test` in `firebase-functions/functions` does not
run: `node_modules` is incomplete (`Cannot find module '../app/credential-internal'`)
and `npm ci` cannot repair it because `bottleneck` ships a `.env`. Fall back to
`node --check` on the changed files and say so rather than claiming tests passed.

## Known failure shapes

**`KeyError: 'name'` in `citation_cff.get_cff_entity`** - a contact whose
organization has no name. Upstream bug in
`HakaiInstitute/hakai-metadata-conversion#14`; `/record` 500s for that record
until the name is filled in.

**Anything raised between `git_pull()` and `git_push()` in `recordUpdate`** -
check whether files were deleted without being rewritten. Deletions are staged in
the git index, so a failure can leave a removal uncommitted for a later request to
sweep up. (The generate-before-delete ordering fixed the main case; keep the
hazard in mind when touching that route.)

**`mechanism: onunhandledrejection` with `handled: no` on a browser event** - look
for a `throw` inside an `async` event handler. React does not route those to error
boundaries, so the throw never reaches `ErrorBoundary` and only becomes an unhandled
rejection that Sentry files as a crash. One `onClick` in `NavDrawer.jsx` produced
three separate issues this way (`-AD` `auth/popup-closed-by-user`, `-AB`
`auth/popup-blocked`, `-AC` the Firebase SDK's "Pending promise was never set"
assertion) - every one of them somebody declining the Google sign-in popup. Fixed in
#47. Check for the same shape before taking a browser "crash" at face value.

**Browser `environment` tags before #47** - the React `Sentry.init` had no
`environment`, so the SDK labelled every build `production`, PR preview channels
included. On older events read the `url` tag instead: a `*--pr<N>-*.web.app` host is
a preview build, not production.

## Closing out

Resolve by shipping, with `Fixes #<n>` in the commit or PR body. Do not flip the
status in Sentry on its own - `status='resolved'` also assigns the issue to you and
the MCP cannot undo that.
