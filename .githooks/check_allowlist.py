"""pre-push: every path in each pushed commit's tree must be on that commit's ALLOWLIST."""
import subprocess
import sys

ZERO = "0" * 40


def allowed(path, rules):
    return any(path == r or (r.endswith("/") and path.startswith(r)) for r in rules)


bad = []
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 4 or parts[1] == ZERO:
        continue
    sha = parts[1]
    try:
        text = subprocess.run(["git", "show", f"{sha}:ALLOWLIST"], capture_output=True, check=True, text=True).stdout
    except subprocess.CalledProcessError:
        print("pre-push: REFUSED, the pushed commit has no ALLOWLIST", file=sys.stderr)
        sys.exit(1)
    rules = [r.strip() for r in text.splitlines() if r.strip() and not r.startswith("#")]
    paths = subprocess.run(["git", "ls-tree", "-r", "--name-only", sha], capture_output=True, check=True,
                           text=True).stdout.splitlines()
    bad += [p for p in paths if not allowed(p, rules)]
if bad:
    print("pre-push: REFUSED, these paths are not on ALLOWLIST (this repository is public):", file=sys.stderr)
    for p in sorted(set(bad))[:20]:
        print("  " + p, file=sys.stderr)
    sys.exit(1)
