# Security Exceptions & Policy Waivers

## 1. Exception Governance Policy

In DevSecOps pipelines, automated security gates block builds that exhibit **Critical** or **High** severity vulnerabilities or detected secrets. However, certain findings may represent:
1. **False Positives:** A pattern incorrectly flagged by static heuristic matching.
2. **Unreachable Code Paths:** A vulnerability in a vendored dependency or package that is never invoked during runtime execution.
3. **Compensating Controls:** A vulnerability mitigated by infrastructure-level defenses (e.g. AWS WAF, VPC isolation, read-only root filesystems).

Any security waiver must be formally requested, reviewed by the Security Lead, and assigned an expiration date for periodic re-evaluation.

---

## 2. Active Security Exceptions Registry

| Vulnerability / Rule ID | Security Tool | Exception Type | Business & Technical Justification | Owner / Approver | Expiration Date | Tracking File |
|---|---|---|---|---|---|---|
| `CVE-2026-102276` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`brace-expansion`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-102278` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`brace-expansion`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-13149` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`brace-expansion`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-14257` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`brace-expansion`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-69152` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`brace-expansion`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-69192` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`ip-address`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-9496` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`pacote`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-33671` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`picomatch`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `CVE-2026-48815` | Trivy Container | Accepted Risk | Bundled npm build-time tool (`sigstore`) not reachable in runtime node server. | Isha Javed (Security Lead) | `2026-12-01` | `.trivyignore` |
| `demo-api-key` | Gitleaks | False Positive / Demo Waiver | Synthetic dummy demonstration secret strictly restricted to test branch (`demo/vulnerable`). Real secrets never accepted. | Isha Javed (Security Lead) | Permanent (Test Only) | `.gitleaks.toml` |

---

## 3. How to Implement an Approved Exception

### For Trivy Container / Dependency Scans:
1. Add the CVE ID and justification to `.trivyignore` in the repository root:
   ```text
   CVE-2026-102276  # Bundled npm build-time tool; Isha; review 2026-12-01
   ```
2. Commit the change along with the updated `docs/EXCEPTIONS.md`.

### For Gitleaks Secret Detection:
1. Add custom allowlist or rule tuning to `.gitleaks.toml`:
   ```toml
   [allowlist]
   description = "Allowed demonstration mock tokens"
   regexes = ['''DEMO_DUMMY_[A-Z0-9]+''']
   ```

---

## 4. Periodic Review Cadence
All security waivers are audited every 30 days. Expired exceptions that have not been granted an extension must be remediated immediately.
