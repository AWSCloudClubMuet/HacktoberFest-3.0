"""Run issue #9 tests and verify (or refresh) the recorded aggregate results."""

import argparse
import json
from pathlib import Path
import subprocess
import sys

from calculations import results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-results", action="store_true",
                        help="After tests pass, refresh CALCULATIONS.json and VERIFICATION.txt")
    args = parser.parse_args()
    folder = Path(__file__).resolve().parent
    completed = subprocess.run(
        [sys.executable, "-m", "unittest", "discover", "-s", ".", "-p", "test_*.py", "-v"],
        cwd=folder, capture_output=True, text=True, check=False,
    )
    log = completed.stdout + completed.stderr
    print(log, end="")
    if completed.returncode:
        return completed.returncode
    data = results()
    serialized = json.dumps(data, indent=2, sort_keys=True, allow_nan=False) + "\n"
    record = folder / "CALCULATIONS.json"
    if args.write_results:
        record.write_text(serialized, encoding="utf-8")
    if not record.exists() or json.loads(record.read_text(encoding="utf-8")) != json.loads(serialized):
        print("FAIL: recorded calculations are missing or stale; review before refreshing.")
        return 1
    log += "PASS: recorded calculations match freshly computed results.\n"
    log += "Scope: aggregate-data analysis only; no training or review experiment was run.\n"
    if args.write_results:
        (folder / "VERIFICATION.txt").write_text(log, encoding="utf-8")
    print("PASS: recorded calculations match freshly computed results.")
    print("Scope: aggregate-data analysis only; no training or review experiment was run.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
