# Security Findings & Vulnerability Comparison

## 1. Before vs After Vulnerability Matrix

The following metrics illustrate the vulnerability posture comparison between the vulnerable test branch (`demo/vulnerable`) and the hardened production branch (`main`).

| Severity Level | Vulnerable Branch (`demo/vulnerable`) | Fixed Branch (`main`) | Remediation Status |
|---|:---:|:---:|:---:|
| **Critical** | 8 | **0** | **100% Remediated** |
| **High** | 24 | **0** | **100% Remediated** |
| **Medium** | 19 | 0 | Controlled / Mitigated |
| **Low** | 6 | 0 | Controlled / Mitigated |
| **Secrets Detected** | 1 | **0** | **Revoked & Removed** |
| **Total Findings** | **58** | **0** | **Clean Build** |
| **Pipeline Gate Status** | ❌ **FAILED** | ✅ **PASSED** | Complies with Security Policy |

---

## 2. In-Depth Example Findings & Remediation

### Finding 1: Dependency Vulnerability — `lodash` Prototype Pollution & Command Injection
- **Scanner:** Trivy Filesystem (`reports/trivy-fs.json`) & `npm audit`
- **Vulnerability ID:** [CVE-2021-23337](https://nvd.nist.gov/vuln/detail/CVE-2021-23337) / [CVE-2020-8203](https://nvd.nist.gov/vuln/detail/CVE-2020-8203)
- **Severity:** `HIGH`
- **Affected Component:** `lodash@4.17.15`
- **Location:** `package.json`, `package-lock.json`
- **Impact:** Vulnerability in `template` command allows injection of arbitrary JavaScript during template compilation, leading to Remote Code Execution (RCE) or Prototype Pollution.
- **Remediation:** Upgraded `lodash` from `4.17.15` to `^4.17.21` where template compilation sanitization is enforced.

---

### Finding 2: Outdated Framework Vulnerabilities — `express` Transitive Dependencies
- **Scanner:** Trivy Filesystem & `npm audit`
- **Vulnerability ID:** [CVE-2024-43796](https://nvd.nist.gov/vuln/detail/CVE-2024-43796) / [CVE-2024-43799](https://nvd.nist.gov/vuln/detail/CVE-2024-43799) / [CVE-2022-24999](https://nvd.nist.gov/vuln/detail/CVE-2022-24999)
- **Severity:** `HIGH`
- **Affected Component:** `express@4.17.1` (transitive deps: `send`, `serve-static`, `path-to-regexp`)
- **Location:** `package.json`
- **Impact:** Path traversal and cross-site scripting vulnerabilities in static file serving modules bundled with legacy Express 4.17.1.
- **Remediation:** Upgraded `express` to `^4.21.2` and pinned modern release sub-dependencies in `package-lock.json`.

---

### Finding 3: Container OS Base Image CVEs — `node:14-alpine`
- **Scanner:** Trivy Container Image Scanner (`reports/trivy-image.json`)
- **Vulnerability ID:** [CVE-2022-0778](https://nvd.nist.gov/vuln/detail/CVE-2022-0778) (OpenSSL infinite loop DoS) & [CVE-2021-3711](https://nvd.nist.gov/vuln/detail/CVE-2021-3711) (OpenSSL buffer overflow)
- **Severity:** `CRITICAL`
- **Affected Component:** `libcrypto1.1`, `libssl1.1`, `apk-tools` in Node 14 image
- **Location:** `Dockerfile` (base image `FROM node:14-alpine`)
- **Impact:** Node.js 14 reached End-of-Life (EOL) in April 2023. The underlying Alpine 3.11 distribution stopped receiving security patches, exposing the runtime to critical memory corruption and DoS exploits.
- **Remediation:** Replaced base image with active LTS `node:22-alpine` based on modern Alpine Linux with patched cryptographic libraries and hardened kernels.

---

### Finding 4: Hardcoded Secret Detection
- **Scanner:** Gitleaks (`reports/gitleaks.json`)
- **Rule ID:** `demo-api-key`
- **Severity:** `CRITICAL`
- **Affected File:** `src/server.js:14` (on vulnerable branch)
- **Impact:** Hardcoded API key or private secret committed into source control allows malicious actors with repository read permissions to impersonate services or compromise cloud accounts.
- **Remediation:**
  1. Purged the hardcoded variable assignment from `src/server.js`.
  2. Verified `.gitignore` prevents local `.env` and credential files from being tracked.
  3. Documented policy requiring all production credentials to be loaded through AWS Secrets Manager or environment variables at runtime.

---

### Finding 5: Static Analysis Code Injection — `eval()` Usage
- **Scanner:** Semgrep SAST (`reports/semgrep.json`)
- **Rule ID:** `javascript.lang.security.audit.eval-with-expression`
- **Severity:** `HIGH` (Semgrep `ERROR`)
- **Affected File:** `src/server.js:15` (on vulnerable branch)
- **Impact:** User-controlled input passed directly to `eval(req.query.expr)` enables arbitrary remote code execution within the Node.js process.
- **Remediation:** Removed the insecure `/calc` debug endpoint and implemented strict input validation and length-bounding (`slice(0, 50)`) on the `/greet` endpoint.
