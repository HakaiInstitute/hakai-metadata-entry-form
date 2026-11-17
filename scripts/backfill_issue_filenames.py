#!/usr/bin/env python3

"""
Backfill the Record Filename line on metadata-review issues that were created empty.

notify.js used to read the record back before submitRecord had finished writing the
filename, so issues created before that was fixed have "Record Filename:<>". The
filename itself was never lost - the write landed in firebase a moment later - so this
reads it back per issue and patches the body.

Dry run by default. Pass --apply to actually edit the issues.

Needs the gh CLI authenticated, and a firebase service account key (--key, or the
FIREBASE_SERVICE_ACCOUNT_KEY env var holding the key JSON).
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "firebase_to_xml"))

from firebase_to_xml.get_records_from_firebase import get_records_from_firebase

REPO = "HakaiInstitute/metadata-review"

FILENAME_LINE = re.compile(r"(Record Filename:<)([^>]*)(>)")
URL_LINE = re.compile(r"Record URL:<([^>]*)>")
# https://hakaiinstitute.github.io/hakai-metadata-entry-form/#/<language>/<region>/<userID>/<recordID>
RECORD_URL = re.compile(r"#/([^/]+)/([^/]+)/([^/]+)/([^/\s]+)")


def derive_filename(record):
    # Same as get_filename in firebase_to_xml.__main__ and getRecordFilename in
    # src/utils/misc.js, inlined to avoid pulling in that module's yaml/metadata_xml
    # imports for eight lines of string work.
    name = record["title"][record["language"]][0:30] + "_" + record["identifier"][0:5]
    return "".join(
        character if character.isalnum() else "_" for character in name.strip().lower()
    )


def sanitize(value):
    # Same treatment issue.js gives record fields before interpolating them: a value
    # cannot close the <...> wrapper and inject its own markdown into the issue.
    return re.sub(r"[<>]", "", re.sub(r"[\r\n]+", " ", str(value or ""))).strip()


def gh_json(*args):
    result = subprocess.run(
        ["gh", *args], capture_output=True, text=True, check=True
    )
    return json.loads(result.stdout)


def load_key(key_path):
    key_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if key_json:
        return json.loads(key_json)
    if key_path and Path(key_path).is_file():
        return json.loads(Path(key_path).read_text())
    sys.exit(
        "No firebase credentials. Pass --key path/to/key.json or set "
        "FIREBASE_SERVICE_ACCOUNT_KEY."
    )


def lookup_filename(region, user_id, record_id, key):
    record_url = f"{region}/users/{user_id}/records/{record_id}"
    records = get_records_from_firebase(region, None, record_url, None, key)
    record = records[0] if records else None
    if not record:
        return None, "record no longer in firebase"

    stored = record.get("filename")
    if stored:
        return sanitize(stored), None

    # Nothing stored - derive it the same way the form and the record generator do.
    try:
        return sanitize(derive_filename(record)), None
    except (KeyError, TypeError):
        return None, "record has no title/identifier to derive a filename from"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply", action="store_true", help="edit the issues (default is a dry run)"
    )
    parser.add_argument(
        "--state", default="open", choices=["open", "closed", "all"],
        help="which issues to scan (default: open)",
    )
    parser.add_argument(
        "--key", default="firebase_to_xml/keys/key.json",
        help="path to the firebase service account key",
    )
    args = parser.parse_args()

    key = load_key(args.key)

    issues = gh_json(
        "api", "--paginate",
        f"repos/{REPO}/issues?state={args.state}&per_page=100",
    )
    # The issues endpoint returns PRs too.
    issues = [issue for issue in issues if "pull_request" not in issue]

    patched = skipped = 0

    for issue in issues:
        body = issue.get("body") or ""
        match = FILENAME_LINE.search(body)
        if not match or match.group(2).strip():
            continue

        number = issue["number"]
        url_match = URL_LINE.search(body)
        parts = RECORD_URL.search(url_match.group(1)) if url_match else None
        if not parts:
            print(f"#{number}: skipped, no parsable Record URL")
            skipped += 1
            continue

        _language, region, user_id, record_id = parts.groups()
        filename, problem = lookup_filename(region, user_id, record_id, key)
        if not filename:
            print(f"#{number}: skipped, {problem}")
            skipped += 1
            continue

        print(f"#{number}: {filename}")
        if args.apply:
            new_body = FILENAME_LINE.sub(
                lambda m: f"{m.group(1)}{filename}{m.group(3)}", body, count=1
            )
            subprocess.run(
                ["gh", "api", "--method", "PATCH", f"repos/{REPO}/issues/{number}",
                 "-f", f"body={new_body}"],
                capture_output=True, text=True, check=True,
            )
        patched += 1

    verb = "patched" if args.apply else "would patch"
    print(f"\n{verb} {patched}, skipped {skipped}")
    if not args.apply and patched:
        print("Dry run - re-run with --apply to edit the issues.")


if __name__ == "__main__":
    main()
