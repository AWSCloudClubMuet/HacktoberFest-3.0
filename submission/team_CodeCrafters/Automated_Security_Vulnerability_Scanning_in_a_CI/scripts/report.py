#!/usr/bin/env python3
"""
Automated DevSecOps Security Report Generator
Parses scan reports from Semgrep (SAST), Trivy (SCA & Container), and Gitleaks (Secret Detection).
Computes metrics, evaluates security gate policies, and outputs Markdown + HTML summaries.
"""

import json
import os
import sys
import html
from collections import Counter

# Ensure UTF-8 output encoding for cross-platform compatibility (Windows cp1252 fix)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

SEV = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

def load(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

counts = {k: Counter() for k in ["SAST", "Dependencies", "Container"]}
details = []

# 1. Semgrep SAST Parser
# Mapping Semgrep severity: CRITICAL -> CRITICAL, ERROR -> HIGH, WARNING -> MEDIUM, INFO -> LOW
semgrep_map = {
    "CRITICAL": "CRITICAL",
    "ERROR": "HIGH",
    "WARNING": "MEDIUM",
    "INFO": "LOW"
}
sg = load("reports/semgrep.json") or {"results": []}
for r in sg.get("results", []):
    raw_sev = r.get("extra", {}).get("severity", "LOW").upper()
    s = semgrep_map.get(raw_sev, "LOW")
    counts["SAST"][s] += 1
    check_id = r.get("check_id", "unknown").split(".")[-1]
    path = r.get("path", "unknown")
    line = r.get("start", {}).get("line", 1)
    message = r.get("extra", {}).get("message", "Review code security guidelines")
    # Shorten message for display table
    short_msg = (message[:55] + "...") if len(message) > 55 else message
    details.append(("SAST", s, check_id, f"{path}:{line}", short_msg))

# 2. Trivy SCA & Container Parser
def parse_trivy(path, category):
    data = load(path) or {}
    results = data.get("Results", [])
    if not isinstance(results, list):
        return
    for res in results:
        target = res.get("Target", "")
        vulns = res.get("Vulnerabilities") or []
        for v in vulns:
            s = v.get("Severity", "LOW").upper()
            if s not in SEV:
                s = "LOW"
            counts[category][s] += 1
            pkg = v.get("PkgName", "package")
            ver = v.get("InstalledVersion", "curr")
            fix = v.get("FixedVersion") or "no fix yet"
            vuln_id = v.get("VulnerabilityID", "N/A")
            details.append((category, s, vuln_id, f"{pkg}@{ver}", f"upgrade to {fix}"))

parse_trivy("reports/trivy-fs.json", "Dependencies")
parse_trivy("reports/trivy-image.json", "Container")

# 3. Gitleaks Secrets Parser
gl = load("reports/gitleaks.json") or []
if not isinstance(gl, list):
    gl = []
secrets = len(gl)

# Calculate totals
total = Counter()
for c in counts.values():
    total.update(c)

all_findings = sum(total.values()) + secrets
blocking = total["CRITICAL"] + total["HIGH"] + secrets
status = "FAILED" if blocking > 0 else "PASSED"

baseline = load("docs/baseline.json") or {}
baseline_total = baseline.get("total", 0)
fixed = max(0, baseline_total - all_findings) if baseline_total else 0

# Generate Markdown Report
lines = [
    f"# Security Gate Report: {'❌' if blocking else '✅'} {status}",
    "",
    f"**Total Findings:** {all_findings} | **Secrets:** {secrets} | "
    f"**Fixed vs Baseline:** {fixed} | **Unresolved:** {all_findings}",
    "",
    "### Vulnerability Severity Matrix",
    "",
    "| Category | Critical | High | Medium | Low |",
    "|---|---|---|---|---|",
]
for k, c in counts.items():
    lines.append(f"| {k} | " + " | ".join(str(c[s]) for s in SEV) + " |")
lines.append("| **Total** | " + " | ".join(str(total[s]) for s in SEV) + " |")

lines += [
    "",
    "### Top Security Findings (Critical / High / Secrets)",
    "",
    "| Category | Severity | ID | Target / Location | Remediation / Advisory |",
    "|---|---|---|---|---|",
]

crit_high = [x for x in details if x[1] in ("CRITICAL", "HIGH")]
for d in crit_high[:40]:
    lines.append("| " + " | ".join(d) + " |")

for g in gl:
    rule_id = g.get("RuleID", "Hardcoded Secret")
    file_path = g.get("File", "unknown")
    start_line = g.get("StartLine", "?")
    lines.append(f"| Secret | CRITICAL | {rule_id} | {file_path}:{start_line} | Revoke immediately and remove from git |")

if not crit_high and not gl:
    lines.append("| Pipeline Gate | PASS | None | All Clean | No blocking vulnerabilities detected |")

md = "\n".join(lines)

# Write report.md
os.makedirs("reports", exist_ok=True)
with open("report.md", "w", encoding="utf-8") as f:
    f.write(md + "\n")

# Generate styled HTML report
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Security Pipeline Report - {status}</title>
<style>
  :root {{
    --bg: #090d16;
    --surface: #131b2e;
    --border: #23314e;
    --text: #f1f5f9;
    --muted: #94a3b8;
    --pass: #10b981;
    --fail: #ef4444;
    --crit: #dc2626;
    --high: #f97316;
    --med: #eab308;
    --low: #3b82f6;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    margin: 0;
    padding: 2.5rem 1.5rem;
    line-height: 1.5;
  }}
  .container {{
    max-width: 1000px;
    margin: 0 auto;
  }}
  .header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.75rem 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }}
  .header h1 {{ margin: 0 0 0.4rem 0; font-size: 1.6rem; font-weight: 700; }}
  .header .sub {{ color: var(--muted); font-size: 0.95rem; }}
  .badge {{
    padding: 0.6rem 1.5rem;
    border-radius: 9999px;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: {'rgba(239, 68, 68, 0.15)' if blocking else 'rgba(16, 185, 129, 0.15)'};
    color: {'var(--fail)' if blocking else 'var(--pass)'};
    border: 1px solid {'var(--fail)' if blocking else 'var(--pass)'};
  }}
  .metrics-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }}
  .metric-card {{
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
  }}
  .metric-title {{ color: var(--muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }}
  .metric-value {{ font-size: 2.2rem; font-weight: 800; margin-top: 0.35rem; }}
  .card {{
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }}
  h2 {{ margin-top: 0; font-size: 1.25rem; color: #fff; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.92rem;
  }}
  th, td {{
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }}
  th {{
    background: rgba(255, 255, 255, 0.03);
    color: var(--muted);
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}
  tr:last-child td {{ border-bottom: none; }}
  .tag {{
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }}
  .tag-CRITICAL {{ background: rgba(220, 38, 38, 0.2); color: #f87171; border: 1px solid rgba(220, 38, 38, 0.4); }}
  .tag-HIGH {{ background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }}
  .tag-MEDIUM {{ background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }}
  .tag-LOW {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }}
  code {{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: rgba(255,255,255,0.06); padding: 0.15rem 0.4rem; border-radius: 4px; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <h1>DevSecOps Security Pipeline Report</h1>
      <div class="sub">CI/CD Automated Security Vulnerability Gate</div>
    </div>
    <div class="badge">{'❌ FAILED' if blocking else '✅ PASSED'}</div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-title">Total Findings</div>
      <div class="metric-value">{all_findings}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Secrets Detected</div>
      <div class="metric-value" style="color: {'var(--crit)' if secrets else 'var(--pass)'};">{secrets}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Fixed vs Baseline</div>
      <div class="metric-value" style="color: var(--pass);">{fixed}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Blocking (Crit/High)</div>
      <div class="metric-value" style="color: {'var(--fail)' if blocking else 'var(--pass)'};">{blocking}</div>
    </div>
  </div>

  <div class="card">
    <h2>Vulnerability Severity Matrix</h2>
    <table>
      <thead>
        <tr><th>Category</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th></tr>
      </thead>
      <tbody>
"""
for k, c in counts.items():
    html_content += f"        <tr><td><strong>{html.escape(k)}</strong></td>" + "".join(f"<td>{c[s]}</td>" for s in SEV) + "</tr>\n"
html_content += f"""        <tr style="font-weight: bold; background: rgba(255,255,255,0.04);">
          <td>Total</td>""" + "".join(f"<td>{total[s]}</td>" for s in SEV) + """
        </tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Critical & High Security Findings</h2>
"""
if not crit_high and not gl:
    html_content += """    <p style="color: var(--pass); font-weight: 600; margin: 1rem 0;">
      ✔ No Critical or High vulnerabilities detected. The build complies with security gates.
    </p>"""
else:
    html_content += """    <table>
      <thead>
        <tr><th>Category</th><th>Severity</th><th>Identifier</th><th>Location / Target</th><th>Remediation Advice</th></tr>
      </thead>
      <tbody>
"""
    for d in crit_high[:40]:
        html_content += f"""        <tr>
          <td>{html.escape(d[0])}</td>
          <td><span class="tag tag-{html.escape(d[1])}">{html.escape(d[1])}</span></td>
          <td><code>{html.escape(d[2])}</code></td>
          <td>{html.escape(d[3])}</td>
          <td>{html.escape(d[4])}</td>
        </tr>\n"""
    for g in gl:
        html_content += f"""        <tr>
          <td>Secret</td>
          <td><span class="tag tag-CRITICAL">CRITICAL</span></td>
          <td><code>{html.escape(g.get('RuleID', 'secret'))}</code></td>
          <td>{html.escape(g.get('File', ''))}:{g.get('StartLine', '')}</td>
          <td>Revoke immediately and remove from repository</td>
        </tr>\n"""
    html_content += """      </tbody>
    </table>
"""

html_content += """  </div>
</div>
</body>
</html>"""

with open("report.html", "w", encoding="utf-8") as f:
    f.write(html_content)

# GitHub Actions Step Summary support
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
        f.write(md + "\n")

print(md)
sys.exit(1 if blocking > 0 else 0)
