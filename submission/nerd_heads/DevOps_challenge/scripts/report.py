"""
Reads the results of all 4 scanners, builds one security report,
and decides if the pipeline PASSES or FAILS.

SECURITY POLICY:
  - Any CRITICAL or HIGH finding  -> pipeline FAILS
  - Any leaked secret             -> counted as CRITICAL -> pipeline FAILS
  - MEDIUM and LOW findings       -> reported, but allowed to pass
"""
import json
import os
import sys

counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
by_tool = {}
rows = []


def load(path):
    """Read a JSON file. Return empty data if the file is missing or broken."""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def add(tool, sev, issue, location):
    counts[sev] += 1
    by_tool[tool] = by_tool.get(tool, 0) + 1
    rows.append((tool, sev, issue, location))


# 1. Semgrep: its levels are ERROR / WARNING / INFO
semgrep_map = {"ERROR": "HIGH", "WARNING": "MEDIUM", "INFO": "LOW"}
for r in load("semgrep.json").get("results", []):
    sev = semgrep_map.get(r["extra"]["severity"], "LOW")
    add("Code (Semgrep)", sev, r["check_id"].split(".")[-1], f'{r["path"]}:{r["start"]["line"]}')

# 2. Gitleaks: every leaked secret is CRITICAL
for leak in load("gitleaks.json") or []:
    add("Secret (Gitleaks)", "CRITICAL", leak.get("RuleID", "secret"),
        f'{leak.get("File", "?")}:{leak.get("StartLine", "?")} '
        f'(fingerprint: `{leak.get("Fingerprint", "?")}`)')

# 3 + 4. Trivy: dependencies and container image
for tool, path in [("Dependency (Trivy)", "trivy-deps.json"),
                   ("Container (Trivy)", "trivy-image.json")]:
    for res in load(path).get("Results", []):
        for v in res.get("Vulnerabilities") or []:
            sev = v.get("Severity", "LOW")
            if sev not in counts:
                sev = "LOW"
            fix = v.get("FixedVersion") or "no fix yet"
            add(tool, sev, v["VulnerabilityID"],
                f'{v["PkgName"]} {v.get("InstalledVersion", "")} -> fix: {fix}')

# ---------- Decide PASS / FAIL ----------
failed = counts["CRITICAL"] + counts["HIGH"] > 0
status = "❌ FAILED" if failed else "✅ PASSED"
total = sum(counts.values())

# ---------- Build the Markdown report ----------
md = [
    "# 🛡️ Security Scan Report", "",
    f"## Pipeline status: {status}", "",
    f"**Total findings: {total}**", "",
    "**Policy:** CRITICAL or HIGH findings (including any leaked secret) fail the pipeline. "
    "MEDIUM and LOW are reported only.", "",
    "### Findings by severity", "| Severity | Count |", "|---|---|",
]
icons = {"CRITICAL": "🟥", "HIGH": "🟧", "MEDIUM": "🟨", "LOW": "🟩"}
md += [f"| {icons[s]} {s} | {c} |" for s, c in counts.items()]

md += ["", "### Findings by scanner", "| Scanner | Count |", "|---|---|"]
for tool in ["Code (Semgrep)", "Secret (Gitleaks)", "Dependency (Trivy)", "Container (Trivy)"]:
    md.append(f"| {tool} | {by_tool.get(tool, 0)} |")

if rows:
    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    rows.sort(key=lambda r: order[r[1]])
    md += ["", "### All findings", "| Scanner | Severity | Issue | Location / Fix |", "|---|---|---|---|"]
    md += [f"| {a} | {b} | {c} | {d} |" for a, b, c, d in rows]
else:
    md += ["", "No findings. 🎉"]

text = "\n".join(md) + "\n"

with open("report.md", "w", encoding="utf-8") as f:
    f.write(text)

summary = os.environ.get("GITHUB_STEP_SUMMARY")
if summary:
    with open(summary, "a", encoding="utf-8") as f:
        f.write(text)

print(text)
sys.exit(1 if failed else 0)