# Team Bhai Issue Hougya — Hackathon Submission

This folder contains our team's project submissions for the hackathon. Each team member worked in their own dedicated issue directory so work could proceed independently without merge conflicts.

---

## Team Members & Contributions

| Member | Assigned Issue / Work | Key Deliverables | Detailed Docs |
| :--- | :--- | :--- | :--- |
| **Hamza Ali** | **Issue #2:** Automated Security Vulnerability Scanning in a CI/CD Pipeline | Core security pipeline (SAST, SCA, Secrets, Container) + **Bonus:** Azure ACR Cloud Delivery | [Issue #2 README](./issue2_Automated_Security_Vulnerability_Scanning/README.md) |
| *[Teammate Name]* | *[Issue / Feature Title]* | *[Summary of deliverables]* | *[Link to folder]* |
| *[Teammate Name]* | *[Issue / Feature Title]* | *[Summary of deliverables]* | *[Link to folder]* |

---

## Issue #2 Summary: Automated Security Vulnerability Scanning

**Owner:** Hamza Ali
**Directory:** [`issue2_Automated_Security_Vulnerability_Scanning/`](./issue2_Automated_Security_Vulnerability_Scanning/)

### What was built
An automated DevSecOps pipeline running in GitHub Actions (`ubuntu-24.04`) that checks code, dependencies, secrets, and container images before deployment. If any Critical or High vulnerability is caught, the pipeline blocks the build.

### Milestones Covered
- **M1: Sample Application & Setup** — Express.js microservice with health checks, task endpoints, and a security-hardened `Dockerfile` (runs as non-root `USER node` on Alpine Linux).
- **M2: Static Analysis (SAST)** — Custom Semgrep rule pack (`semgrep-rules.yml`) targeting code execution (`eval`), path traversal, reflected XSS, and broken hashing.
- **M3: Dependency Scanning (SCA)** — `npm audit` integration checking third-party CVEs (tested with a prototype pollution CVE on `minimist`).
- **M4: Secret Detection** — Gitleaks rules catching exposed cloud keys, tokens, and private secrets.
- **M5: Container Scanning** — CIS Dockerfile benchmark audit and Trivy container layer scanning.
- **M6: CI/CD Security Quality Gate** — Automated gate enforcing a strict zero-tolerance policy on Critical and High risks (verified with both Failed ❌ and Passed ✅ runs).
- **M7: Consolidated Dashboard** — Real-time vulnerability summary matrix written directly into GitHub Actions step summaries.

### ⭐ Optional / Bonus Work (Milestone 8)
- **Microsoft Azure Cloud Delivery:** Integrated with Azure Container Registry (ACR) on our Azure for Students subscription.
- **Zero-Trust Gate Enforcement:** The deployment job only runs if the security gate passed with zero Critical/High findings (`needs: security-gate`, `if: success()`).
- **Registry:** `bhaiissuehougyasecscan.azurecr.io/vuln-scan-app`
- **Immutable Tag:** Images are tagged with the specific commit SHA, not just `latest`.

### Design Decision: Why We Skipped SARIF Uploads
A common question in GitHub security setups is whether to export results as SARIF files via `upload-sarif`. We looked into it and intentionally decided against it: GitHub's `upload-sarif` action requires GitHub Advanced Security (GHAS) or a public repository. On private repositories without an enterprise license, that upload fails.

Instead, we built our reporting around GitHub Actions Step Summaries (`$GITHUB_STEP_SUMMARY`) and archived JSON/Markdown artifacts. It gives everyone an immediate visual breakdown of every finding on the run summary page, works across all repository types (public, private, student accounts), and doesn't rely on paid add-ons.

For complete technical logs, scan commands, rules, and local reproduction instructions, see the **[Issue #2 Technical README](./issue2_Automated_Security_Vulnerability_Scanning/README.md)**.

---

## Verified Pipeline Proof

The screenshot below shows Run #5 on GitHub Actions (`cb6e5f3`): the security gate verified zero Critical/High vulnerabilities, approved the build, and pushed the container image to Azure Container Registry in 1m 29s.

![Verified Pipeline Run](./issue2_Automated_Security_Vulnerability_Scanning/docs/pipeline-success.png)
