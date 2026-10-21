# Backup Policy

## Purpose and scope

This policy protects the small application dataset used by the Webies demo:
customer records, order snapshots, service configuration, incident notes and
an archived quarterly summary. The dataset is synthetic; it contains no real
personal data, credentials or production secrets.

| Item | Value |
| --- | --- |
| Protected data | Every regular file under `sample-data/` |
| Current files | 5 files in 2 directories |
| Storage | One private, versioned S3 bucket provisioned by Terraform |
| Backup owner | Webies team |
| Operational owner | The team member on backup duty for the week |
| Review owner | A second team member who checks the evidence and report |
| Environment | LocalStack Pro for development; a dedicated AWS sandbox for evidence |
| Backup tool | `scripts/backup.mjs` (Node.js 20+, AWS SDK v3) |
| Verification tool | `scripts/verify.mjs` |
| Restore tool | `scripts/restore.mjs` |
| Reporting tool | `scripts/report.mjs` |

The policy covers the backup copy, its version history and the evidence that
the copy can be restored. It does not cover the source application database,
which is out of scope for this hackathon.

## Data classification and handling

- All sample files are synthetic and classified as internal demo data.
- Do not add real customer data, API keys, private keys, passwords or `.env`
  files to `sample-data/`.
- The bucket is private, encrypted with SSE-S3 and has public access blocked.
- TLS-only access is enforced by bucket policy on real AWS.
- Access is limited to the backup role and the operator's AWS identity.

## Backup frequency and schedule

| Environment | Frequency | Trigger |
| --- | --- | --- |
| Demo / LocalStack | On demand, at least once per evidence run | Manual `node scripts/backup.mjs` |
| Real AWS target | Daily at 02:00 UTC | Manual run for the hackathon; a scheduled job is an optional extension |

The target recovery point objective (RPO) for a daily schedule is 24 hours.
If the team needs a tighter RPO, run more frequently and record the new
schedule here. The demo's actual RPO is the time of the last successful run
because no scheduler is deployed. Run `node scripts/check-freshness.mjs` from
a scheduler or monitoring job after the expected window; it exits 1 and
publishes `backup.missed` when the latest successful run is older than the
configured limit (default 26 hours).

The target recovery time objective (RTO) is 1 hour for a single-file restore
and 4 hours for a full rebuild. See `docs/disaster-recovery.md` for the
scenario details and assumptions.

## Retention

| Data | Retention | Mechanism |
| --- | --- | --- |
| Timestamped run copies in `backups/` | Current objects retained until explicitly deleted | S3 versioning + no current-version expiry rule |
| `latest/` mirror versions | Noncurrent versions expire after 7 days | Lifecycle rule `expire-noncurrent-versions` |
| Incomplete multipart uploads | Aborted after 1 day | Lifecycle rule |
| Local manifest | Kept with the repository/evidence for the project | `manifests/manifest.json` |
| Local report | Regenerated on demand; latest copy kept | `reports/backup-status.md` |

The Terraform variable `noncurrent_version_retention_days` accepts 7-30 days
and defaults to 7 for the demo. A production policy should choose a window
that matches the business recovery window; 30 days is a common starting point.

The 7-day retention is a recovery window, not a guarantee that an object can
be recovered after 7 days. Once a noncurrent version expires, it cannot be
restored.

## Backup method

1. Read every regular file under the source directory.
2. Compute SHA-256 and size before upload.
3. Upload an immutable copy to
   `backups/<timestamped-run-id>/<relative-path>`.
4. Upload the same bytes to `latest/<relative-path>` so a stable key always
   points at the most recent content and still has version history.
5. Request SSE-S3 (`AES256`) and store the checksum in object metadata.
6. Append the run to `manifests/manifest.json` with:
   - run ID, start and finish times, status;
   - bucket, region and environment;
   - per-file source name, size, SHA-256, archive key, archive version ID,
     latest key, latest version ID and error text.
7. Publish an SNS alert if any file failed.
8. Exit non-zero if any file failed so a scheduler or CI job notices.

The manifest is written atomically. The scripts assume one backup process at a
time; there is no distributed lock.

## Verification policy

- Verify after every backup run with `node scripts/verify.mjs`.
- Verification downloads the exact archive and latest version IDs from the
  manifest and compares size and SHA-256. It does not trust object metadata
  alone.
- A run passes only when every file has a successful archive and latest
  version, both versions exist, both sizes match and both checksums match.
- A missing object, a size mismatch, a checksum mismatch, a missing version ID
  or a recorded failed upload makes the verification fail and exits 1.
- Verification failures publish an SNS alert when a topic is configured.
- At least once per week during the project, verify an older run with
  `--run-id` to confirm retention is working as expected.
- The report must be regenerated after verification so
  `reports/backup-status.md` shows the latest status.

A separate offline test can corrupt a copy of the manifest (change one expected
SHA-256) and run `verify.mjs --manifest <copy>` to prove corruption detection.
Do not modify the real manifest for this test.

## Restore policy

- Every restore must name an exact S3 `versionId`; restoring "the latest
  object" is not accepted as proof of version recovery.
- Use `restore.mjs --list --key <key>` to discover version IDs.
- Restore to `restored/` or another path outside the protected source tree.
- Compare the printed expected and actual SHA-256 values before using the
  recovered file.
- Record the recovery in the manifest; `report.mjs` shows the latest result.
- Restore failures exit non-zero and must be investigated before the backup
  is considered trustworthy.

## Exclusions

| Excluded | Reason |
| --- | --- |
| `node_modules/` | Reproducible from `package-lock.json`; large and not application data. |
| `.git/` | Version control history is separate; backing it up inside S3 is out of scope. |
| `infra/.terraform/` and `*.tfstate*` | Provider caches and state may contain sensitive values and are not application data. |
| `terraform.tfvars` and `.env` | May contain secrets; never upload. |
| `restored/` | Output of a recovery test, not a source of truth. |
| `reports/` and `manifests/` | Generated evidence; optional S3 report storage is a documented extension. |
| OS/editor files (`.DS_Store`, `.idea/`, `.vscode/`) | Noise, not protected data. |
| Real customer data or credentials | Prohibited in the demo dataset. |

If a future source directory contains a mix of protected and excluded files,
pass a filtered directory with `--source` rather than extending the script
with a fragile ignore list.

## Ownership and responsibilities

| Role | Responsibility |
| --- | --- |
| Webies team | Owns the bucket, IAM role, SNS topic and this policy. |
| Backup operator | Runs the backup, checks the exit code and confirms the manifest was written. |
| Verification reviewer | Runs verification independently and checks the checksum evidence, not just the script exit code. |
| On-call owner | Investigates failure alerts, decides whether to restore, and records the decision. |
| Security owner | Reviews IAM scope, bucket policy and credential handling before the real-AWS run. |
| Team lead | Approves retention changes and signs off the final evidence pack. |

Ownership transfers to the next on-call owner at the end of each week. The
handover includes the current bucket name (from Terraform output), the last
successful run ID and any open failure events.

## Change control

Changes to retention, bucket policy, IAM scope, alert routing or the
`sample-data/` contents require:

1. a pull request or team review;
2. `terraform fmt -check`, `terraform validate` and `npm run check`;
3. a backup, verification and report run;
4. an evidence update in `docs/evidence.md` when the change affects the demo
   steps.

Do not widen IAM permissions to work around an access error. Fix the policy
scope or use the correct role.

## Policy review

Review this policy after the hackathon, after any failed restore test, and
whenever the dataset, retention window or AWS account changes. The current
review date is the date of the final evidence run.
