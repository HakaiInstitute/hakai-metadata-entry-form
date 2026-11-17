# scripts

One-off maintenance scripts. Nothing here runs automatically.

## backfill_issue_filenames.py

Fills in the `Record Filename` line on `HakaiInstitute/metadata-review` issues that were
created with it empty.

### Why these issues are empty

`submitRecord` used to write a record's `status` before its `filename`. Setting the
status immediately fires the `notifyReviewer` trigger
(`firebase-functions/functions/notify.js`), which reads the record back to build the
review issue. On a first-time submission the `filename` write hadn't landed yet, so
`createIssue` received `undefined` and the issue body came out as `Record Filename:<>`.

The filename was never actually lost — the write landed in firebase a moment later. So
for nearly every affected issue this script is just reading back a value that is already
stored. If a record somehow has no `filename`, it derives one the same way the form and
the record generator do (title truncated to 30 chars + the first 5 chars of the
identifier, lowercased, non-alphanumerics replaced with `_`).

The ordering itself is fixed in `src/utils/firebaseRecordFunctions.js`, so newly
submitted records are unaffected. This script only cleans up the backlog.

### What it does

1. Lists issues in `HakaiInstitute/metadata-review` via `gh` (pull requests are skipped).
2. Keeps the ones whose body has an empty `Record Filename:<>`.
3. Parses `Record URL:<...>` for the region, user ID and record ID.
4. Reads that record from firebase and takes its `filename`.
5. Rewrites just that one line in the issue body.

### Requirements

- An authenticated `gh` CLI with write access to `HakaiInstitute/metadata-review`.
- A firebase service account key — pass `--key`, or set `FIREBASE_SERVICE_ACCOUNT_KEY`
  to the key JSON. `firebase_to_xml/keys/` is gitignored and is the usual place to put
  it. The env var wins if both are set.
- `google-auth`, which the root `pyproject.toml` already declares — `uv run` is enough.

### Usage

Dry run first. This is the default and changes nothing:

```sh
uv run scripts/backfill_issue_filenames.py --key firebase_to_xml/keys/key.json
```

It prints one line per issue with the filename it would write, then a summary. When the
output looks right, apply it:

```sh
uv run scripts/backfill_issue_filenames.py --key firebase_to_xml/keys/key.json --apply
```

### Options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--apply` | off | Actually edit the issues. Without it, nothing is written. |
| `--state` | `open` | Which issues to scan: `open`, `closed`, or `all`. |
| `--key` | `firebase_to_xml/keys/key.json` | Path to the firebase service account key. |

### Notes

- Issues that already have a filename are left alone, so re-running is safe.
- An issue whose record has since been deleted from firebase is reported as skipped
  rather than guessed at. Same for a body with no parsable `Record URL`.
- Only the `Record Filename` line is touched; the rest of the body, including the review
  checklist and its tick state, is left exactly as it was.
- Values are stripped of newlines and angle brackets before being written, matching what
  `firebase-functions/functions/issue.js` does, so a record field can't close the `<...>`
  wrapper and inject its own markdown into an issue assigned to real reviewers.
