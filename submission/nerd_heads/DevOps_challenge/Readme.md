# 🛡️ DevSecOps: Automated Security Scanning in a CI/CD Pipeline

This project adds automatic security checks to the delivery pipeline of a small web application, using **GitHub Actions**.
Every time code is pushed, the pipeline scans the **source code**, the **dependencies**, the **Git history for secrets**, and the **Docker image**.
If a serious problem is found, the pipeline **fails** and the build is blocked. If the code is safe, the pipeline **passes**.

The goal is to catch security problems early, before they ever reach production.

---

## 🧰 Tools Used

| Area | Tool | What it checks |
|---|---|---|
| CI/CD | GitHub Actions | Runs all scans automatically on every push |
| Static code analysis | Semgrep | Dangerous patterns in our Python/Flask code |
| Dependency scanning | Trivy (filesystem mode) | Known CVEs in packages listed in `requirements.txt` |
| Secret detection | Gitleaks | API keys, tokens and passwords in code and Git history |
| Container image scanning | Trivy (image mode) | Vulnerable OS packages and libraries inside the Docker image |

> Trivy is used for dependency scanning as a compatible alternative to OWASP Dependency-Check, because it supports Python well and reports severity and fixed versions.

---

## 📁 Project Structure

```
DevOps_challenge/
├── app.py                 # Flask web application
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container build instructions
├── .trivyignore           # Accepted Trivy exceptions (with reasons)
├── .gitleaksignore        # Accepted Gitleaks exceptions (dummy test secret)
├── scripts/
│   └── report.py          # Combines all scan results, builds the report, decides PASS/FAIL
├── screenshots/           # Evidence of the pipeline runs
└── Readme.md
```

The pipeline file is located at the **repository root**: `.github/workflows/devops-challenge.yml`.
GitHub only runs workflows from that location. The workflow is set to run **only when files inside this folder change**, so it does not affect other submissions in the repository.

---

## ⚙️ Build and Deployment Steps

**Run locally (Python):**

```
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

**Run with Docker:**

```
docker build -t devsecops-app .
docker run -p 5000:5000 devsecops-app
```

Open http://localhost:5000 and http://localhost:5000/health

**Application routes:**

| Route | Purpose |
|---|---|
| `/` | Home page |
| `/health` | Health check, returns `{"status": "ok"}` |
| `/resolve?host=example.com` | Resolves a hostname to an IP address (with input validation) |

---

## 🔄 How the Pipeline Works

```
 git push
    │
    ▼
 Checkout ─► Semgrep ─► Gitleaks ─► Trivy (dependencies) ─► Docker build ─► Trivy (image)
                                                                                 │
                                                                                 ▼
                                                                   report.py  (Security Gate)
                                                                   │                      │
                                                         CRITICAL / HIGH found      Nothing serious
                                                                   │                      │
                                                               ❌ FAILED               ✅ PASSED
```

1. The code is checked out with full Git history.
2. **Semgrep** scans the source code using the `p/python` and `p/flask` rule packs.
3. **Gitleaks** scans this folder's files and Git history for secrets.
4. **Trivy** scans `requirements.txt` for vulnerable dependencies.
5. The **Docker image** is built.
6. **Trivy** scans the built image (OS packages and Python libraries).
7. **`report.py`** reads all four JSON results, counts findings by severity, writes the report to the GitHub Actions summary page, and decides PASS or FAIL.
8. All raw reports (`*.json` and `report.md`) are uploaded as a downloadable artifact named `devops-challenge-security-reports`.

The scanners only collect results. The decision is made in one place (`report.py`), so the whole security policy is easy to read and change.

---

## 🚦 Security Policy (Security Gate)

| Finding | Result |
|---|---|
| Any **CRITICAL** finding | ❌ Pipeline fails |
| Any **HIGH** finding | ❌ Pipeline fails |
| Any leaked secret (counted as CRITICAL) | ❌ Pipeline fails |
| **MEDIUM** and **LOW** findings | ⚠️ Reported only, build continues |

Semgrep uses different level names, so they are mapped: `ERROR → HIGH`, `WARNING → MEDIUM`, `INFO → LOW`.

---

## 📊 Reporting and Dashboard

The report appears on the **Summary page of every GitHub Actions run** and shows:

- Pipeline status (Passed / Failed)
- Total number of findings
- Breakdown by Critical, High, Medium and Low
- Breakdown by scanner
- A full list of every finding with its location and available fix

The raw JSON reports can also be downloaded from the run's **Artifacts** section.

---

## 🧪 Demonstration: Failed Run and Passed Run

### Run 1: Vulnerable version (❌ FAILED)

The first version of the app contained security problems **on purpose**, to prove the pipeline catches them:

| Problem | Location | Caught by |
|---|---|---|
| Command injection (`subprocess` with `shell=True` and user input) | `app.py` | Semgrep |
| Flask debug mode enabled | `app.py` | Semgrep |
| App bound to `0.0.0.0` in code | `app.py` | Semgrep |
| Hardcoded GitHub token (**fake dummy value**) | `app.py` | Gitleaks |
| Old Flask 2.2.2 and Werkzeug 2.2.2 with known CVEs | `requirements.txt` | Trivy |
| Outdated OS packages (openssl, perl-base, bsdutils, etc.) | Docker base image | Trivy |

### Run 2: Fixed version (✅ PASSED)

All Critical and High issues were fixed (see the table below), and the pipeline passed.

### Local Semgrep scan

Semgrep was also run locally on Windows against the vulnerable version and found 5 code issues.

![Semgrep findings](screenshots/semgrep-1.png)
![Semgrep summary](screenshots/semgrep-2.png)

---

## 📈 Results: Run 1 vs Run 2

| | Run 1 (vulnerable) | Run 2 (fixed) |
|---|---|---|
| **Total findings** | 333 | ? |
| 🟥 Critical | 7 | ? |
| 🟧 High | 87 | ? |
| 🟨 Medium | 137 | ? |
| 🟩 Low | 102 | ? |
| **Pipeline status** | ❌ FAILED | ✅ PASSED |

**Run 1 findings by scanner:** Semgrep 5, Gitleaks 1, Trivy dependencies 12, Trivy container 315.

### Both runs (Failed and Passed)

![Both runs](screenshots/run2-list.png)

### Run 1: Failed

![Run 1 steps](screenshots/run1-steps.png)
![Run 1 report](screenshots/run1-report.png)
![Run 1 findings](screenshots/run1-findings.png)

### Run 2: Passed

![Run 2 report](screenshots/run2-report.png)

---

## ✅ Fixed vs Unresolved Issues

| Issue | Found by | Severity | Fix applied | Status |
|---|---|---|---|---|
| Command injection (`subprocess` with `shell=True`) | Semgrep | HIGH | Removed `subprocess` completely; used Python's `socket` library with strict input validation | ✅ Fixed |
| Flask debug mode on | Semgrep | MEDIUM | `debug=False` | ✅ Fixed |
| App bound to `0.0.0.0` in code | Semgrep | MEDIUM | Host moved to the `APP_HOST` environment variable (set in Dockerfile) | ✅ Fixed |
| Hardcoded GitHub token (dummy value) | Gitleaks | CRITICAL | Removed from code; secrets are now read from environment variables | ✅ Fixed |
| Flask 2.2.2 known CVEs (e.g. CVE-2023-30861) | Trivy | HIGH | Upgraded to Flask 3.1.3 | ✅ Fixed |
| Werkzeug 2.2.2 known CVEs (e.g. CVE-2023-25577, CVE-2024-34069) | Trivy | HIGH | Upgraded to Werkzeug 3.1.8 | ✅ Fixed |
| OS packages in base image (openssl, perl-base, bsdutils, etc.) | Trivy | CRITICAL / HIGH | Added `apt-get upgrade` in the Dockerfile to install security patches | ✅ Fixed |
| Outdated pip in image | Trivy | varies | Added `pip install --upgrade pip` in the Dockerfile | ✅ Fixed |
| Remaining Medium / Low findings | Trivy | MEDIUM / LOW | Allowed by policy, monitored on every run | ⚠️ Unresolved (accepted) |

---

## 📝 False Positives and Accepted Exceptions

| Exception | Tool | How it is handled | Reason |
|---|---|---|---|
| Dummy token in old Git history | Gitleaks | Fingerprint added to `.gitleaksignore` | It is a fake test value, never a real credential. It was removed from the code, but still exists in an old commit, which cannot be changed without rewriting shared history. |
| OS packages with no vendor fix yet | Trivy | `--ignore-unfixed` flag | These cannot be fixed until Debian releases a patch. They are re-checked on every run and will be reported once a fix exists. |

**Rules followed:**
- Every exception has a written reason.
- No real credentials were ever committed to this repository. Only a test-only dummy token was used for the demonstration.
- A real leaked secret would never be added to an ignore file. It would be removed and rotated immediately.

---

## ☁️ Bonus: AWS Integration (Planned Flow, Milestone 8)

```
 Pipeline PASSED ─► Push image to Amazon ECR ─► Amazon Inspector scans the image
                                                          │
                                                          ▼
                                     Deploy approved image (Amazon ECS / App Runner)
                                                          │
                                                          ▼
                                 Upload reports to a private Amazon S3 bucket
```

1. Create an **Amazon ECR** repository and enable **Amazon Inspector enhanced scanning** for it.
2. Create a private **Amazon S3** bucket with **Block Public Access** and encryption turned on, for storing reports.
3. Store AWS access in **GitHub Secrets** (or better, GitHub OIDC with an IAM role), never in code.
4. Add a second job to the workflow with `needs: security-scan`, so it only runs when the security gate has passed.
5. That job logs in to ECR, pushes the image, and uploads `report.md` and the JSON reports to S3.
6. Because the job depends on the gate, **only approved builds ever reach AWS**.

---

## 🎯 Milestones Covered

| Milestone | Status |
|---|---|
| 1. Repository setup | ✅ Done |
| 2. Static code analysis (Semgrep) | ✅ Done |
| 3. Dependency scanning (Trivy) | ✅ Done |
| 4. Secret detection (Gitleaks) | ✅ Done |
| 5. Container image scanning (Trivy) | ✅ Done |
| 6. CI/CD security gate (Passed and Failed runs) | ✅ Done |
| 7. Reporting and visualization | ✅ Done |
