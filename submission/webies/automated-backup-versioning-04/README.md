# Automated Backup, Versioning, and Disaster Recovery on AWS

A small, working reference implementation for HacktoberFest 3.0 issue #4. It
backs up a sample dataset to a private, versioned S3 bucket, verifies every
upload with SHA-256, restores an exact object version, reports backup status,
and sends failure alerts through SNS to an SQS subscriber (and optionally to
email).

## Team

| Field | Value |
| --- | --- |
| Team | Webies |
| Event | HacktoberFest 3.0 |
| Issue | [AWSCloudClubMuet/HacktoberFest-3.0#4](https://github.com/AWSCloudClubMuet/HacktoberFest-3.0/issues/4) |
| Folder | `submission/webies/automated-backup-versioning-04` |

The team roster is maintained in the event submission form. The
implementation, commands and evidence in this folder do not depend on the
member names.

## What it does

- Creates a private S3 bucket with Block Public Access, SSE-S3 (`AES256`),
  `BucketOwnerEnforced` ownership and a TLS-only bucket policy.
- Enables versioning and expires noncurrent versions after 7 days (the
  variable accepts 7-30 days).
- Uploads every file under `sample-data/` to a timestamped backup prefix and
  to a stable `latest/` mirror, recording SHA-256, size, S3 keys and version
  IDs in a JSON manifest.
- Verifies each recorded version by downloading it and comparing the actual
  size and SHA-256 with the manifest.
- Restores one exact version and proves the restored bytes match the recorded
  checksum.
- Publishes failure alerts to SNS; an SQS queue is a durable subscriber and an
  optional email subscription can receive the same alerts.
- Detects a missed or stale backup by checking the age of the latest
  successful run in the manifest, with an optional `backup.missed` SNS alert.
- Generates a Markdown status report with job counts, last success,
  verification status, recovery status, storage and retention.
- Defines a least-privilege IAM role for a future AWS-hosted runner. The local
  CLI uses the operator's standard AWS credential chain; no credentials are
  stored in the repository.

## Architecture at a glance

```text
 sample-data/  (5 small files)
      |
      |  node scripts/backup.mjs
      v
 +----------------------------------------------+
 | S3 bucket (private, SSE-S3, versioned)       |
 |                                              |
 |  backups/<run-id>/<relative-path>   (run)    |
 |  latest/<relative-path>             (mirror) |
 |                                              |
 |  lifecycle: noncurrent versions -> 7 days    |
 +----------------------+-----------------------+
                        |
        manifest.json   |  failure event
                        v
 +----------------+   +----------------+   +----------------------+
 | verify.mjs     |   | SNS topic      |-->| SQS queue            |
 | restore.mjs    |   |                |-->| email (optional)     |
 | report.mjs     |   |                |   +----------------------+
 +----------------+   +----------------+
```

See [docs/architecture.md](docs/architecture.md) for the component table,
data flow and key layout.

## Technologies

- Terraform `>= 1.6, < 2.0` with the AWS provider `~> 5.60`.
- AWS S3, SNS, SQS and IAM.
- Node.js 20+ with AWS SDK v3 (`@aws-sdk/client-s3`, `client-sns`,
  `client-sqs`).
- `node:fs/promises`, `node:crypto` and `node:path`; no other runtime
  libraries.

## Repository layout

```text
automated-backup-versioning-04/
  README.md
  package.json
  .gitignore
  infra/
    versions.tf               Terraform and provider pins
    providers.tf              AWS provider and credential chain
    variables.tf              Inputs and validation
    main.tf                   S3, lifecycle, IAM, SNS, SQS
    outputs.tf                Bucket, topic, role, region, queue
    terraform.tfvars.example  Copy for local overrides
    .terraform.lock.hcl       Provider checksums (commit this file)
  scripts/
    backup.mjs                Upload, checksum, manifest, failure alert
    verify.mjs                Download and compare size / SHA-256
    restore.mjs               List versions, restore one version, verify
    report.mjs                Render a Markdown status report
    poll-alerts.mjs           Receive SNS alerts from the SQS queue
    check-freshness.mjs       Detect a missed or stale backup from the manifest
    lib/
      s3.mjs                  S3 client, checksum, manifest helpers
      cli.mjs                 Dependency-free argument parser
      alerts.mjs              SNS failure-alert helpers
  sample-data/                Five synthetic files, including a subdirectory
  manifests/
    sample-manifest.json      Synthetic data for offline report rendering
    real-aws-manifest.json    Evidence from the 2026-10-21 real-AWS run
  reports/
    real-aws-backup-status.md Evidence report from the real-AWS run
    backup-status.sample.md   Offline sample render
  docs/
    architecture.md
    backup-policy.md
    disaster-recovery.md
    evidence.md
    limitations.md
```

The default generated manifest is `manifests/manifest.json` and the default
report is `reports/backup-status.md`. Both are ignored by Git. Pass
`--manifest` and `--out` to keep a different copy.

## Prerequisites

- Node.js 20 or newer (`node --version`).
- Terraform 1.6 or newer (`terraform version`).
- AWS credentials with permission to create S3, IAM, SNS and SQS resources.
  Use a profile, SSO session or role; do not put access keys in this folder.
- The AWS CLI is optional and is used only for read-only inspection commands
  in `docs/evidence.md`.

## Deploy to AWS

Run these commands from the team folder:

```bash
cd submission/webies/automated-backup-versioning-04
npm install

export AWS_PROFILE='<your-profile>'
export AWS_REGION=us-east-1
aws sts get-caller-identity

terraform -chdir=infra init
terraform -chdir=infra fmt -check
terraform -chdir=infra validate
terraform -chdir=infra apply \
  -var="alert_email=you@example.com"

export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
export BACKUP_ALERTS_TOPIC_ARN="$(terraform -chdir=infra output -raw sns_topic_arn)"
export ALERT_QUEUE_URL="$(terraform -chdir=infra output -raw sqs_queue_url)"
```

`alert_email` is optional. If it is set, confirm the SNS subscription from the
email before relying on email delivery. The SQS subscriber receives alerts
without confirmation.

Terraform uses local state by default. `.terraform/`, all `.tfstate` files,
`terraform.tfvars` and `crash.log` are ignored by Git.

## Run the core workflow

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

`report.mjs --live` queries S3 for current/noncurrent version counts and
bytes. Without `--live`, it renders from the manifest only and is fully
offline.

Check that the latest successful run is fresh. In production this command
would run from cron, CI, EventBridge or another scheduler after the expected
backup window:

```bash
node scripts/check-freshness.mjs --max-age-hours 26
```

## Prove version history and restore an earlier version

The backup writes an immutable `backups/<run-id>/...` copy and a stable
`latest/<file>` mirror. Running the backup again with changed input creates a
new version of the `latest/` object.

```bash
rm -rf /tmp/webies-backup-demo
cp -r sample-data /tmp/webies-backup-demo
printf '\n# version 2: maintenance banner enabled\n' >> /tmp/webies-backup-demo/service-config.yaml
node scripts/backup.mjs --source /tmp/webies-backup-demo

# Show both versions of the overwritten key.
node scripts/restore.mjs --list --key latest/service-config.yaml

# Restore the first run's latest/ version (now a noncurrent version).
FIRST_RUN="$(node -e "const m=require('./manifests/manifest.json');console.log(m.runs[0].runId)")"
node scripts/restore.mjs --run-id "$FIRST_RUN" --file service-config.yaml \
  --out restored/service-config-v1.yaml
```

The restore command prints the requested version ID, the version returned by
S3, the expected SHA-256 and the actual SHA-256. It exits non-zero if any of
them differ.

You can also address a version explicitly:

```bash
node scripts/restore.mjs --list --key latest/service-config.yaml
node scripts/restore.mjs --key latest/service-config.yaml \
  --version-id '<version-id>' --out restored/service-config-explicit.yaml
```

## Simulate a failure and verify the alert path

```bash
node scripts/backup.mjs --simulate-failure || echo "expected exit code 1"
node scripts/poll-alerts.mjs --queue-url "$ALERT_QUEUE_URL" --wait 10 --delete --expect
node scripts/verify.mjs || echo "expected verification failure"
node scripts/report.mjs --live
```

The backup still uploads the other files, records the failure in the manifest,
publishes an SNS message, and exits 1. The SQS queue contains the JSON alert.
`verify.mjs` detects the missing file and also alerts on the failed
verification.

Finish with a clean, passing backup so the latest report is green:

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

To prove the stale path without waiting, force a future clock and suppress the
alert. This exits 1, as an alerting job should:

```bash
node scripts/check-freshness.mjs --max-age-hours 1 \
  --now 2030-01-01T00:00:00Z --no-alert || echo "expected exit code 1"
```

## Destroy the stack

```bash
terraform -chdir=infra destroy -auto-approve \
  -var="alert_email=you@example.com"
```

Use the same `-var` values you applied with. `force_destroy = true` lets
Terraform delete every object version. That is convenient for the demo and
dangerous for real backups; set it to `false` for retained data and delete
objects through an approved retention process.

Confirm the bucket is gone with the `head-bucket` command in
`docs/evidence.md`.

## Exact command reference

| Task | Command |
| --- | --- |
| Back up `sample-data/` | `node scripts/backup.mjs` |
| Back up another folder | `node scripts/backup.mjs --source /path/to/data` |
| Verify latest run | `node scripts/verify.mjs` |
| Verify a run | `node scripts/verify.mjs --run-id <run-id>` |
| List versions | `node scripts/restore.mjs --list --key latest/<file>` |
| Restore explicit version | `node scripts/restore.mjs --key <key> --version-id <id>` |
| Restore from a run | `node scripts/restore.mjs --run-id <id> --file <file>` |
| Generate report | `node scripts/report.mjs --live` |
| Check for a missed/stale backup | `node scripts/check-freshness.mjs --max-age-hours 26` |
| Poll alerts | `node scripts/poll-alerts.mjs --queue-url "$ALERT_QUEUE_URL" --wait 10 --delete` |
| Syntax check | `npm run check` |
| Format check | `terraform -chdir=infra fmt -check` |
| Validate | `terraform -chdir=infra validate` |
| Destroy stack | `terraform -chdir=infra destroy -auto-approve` |

All scripts accept `--help`, use `--bucket` or `BUCKET_NAME`, and read
credentials from the standard AWS credential chain. No script contains an
access key or secret key.

## Milestone-to-file mapping

| Milestone | Implementation | Evidence |
| --- | --- | --- |
| 1. Data identification and preparation | `sample-data/`, `docs/backup-policy.md` | File listing, policy scope |
| 2. S3 storage setup | `infra/main.tf` (bucket, BPA, SSE-S3, ownership, TLS policy), `infra/outputs.tf` | Bucket settings commands in `docs/evidence.md` |
| 3. Versioning and retention | `aws_s3_bucket_versioning`, lifecycle rule, `scripts/restore.mjs --list` | Two versions and restore log |
| 4. Backup automation | `scripts/backup.mjs`, manifest schema | Backup output + manifest |
| 5. Backup verification | `scripts/verify.mjs` | PASS summary and corruption simulation |
| 6. Recovery simulation | `scripts/restore.mjs` | Restore PASS with matching SHA-256 |
| 7. Monitoring and alerts | SNS topic, SQS subscriber, failure events, `scripts/check-freshness.mjs`, `scripts/poll-alerts.mjs` | SQS alert JSON plus freshness PASS/stale check |
| 8. Disaster recovery planning | `docs/disaster-recovery.md` | RTO/RPO and residual risks |
| 9. Visualization and reporting | `scripts/report.mjs`, `reports/real-aws-backup-status.md` | Report summary screenshot |
| 10. AWS integration bonus | Documented only in `docs/architecture.md` and `docs/limitations.md` | Written design, no implementation claim |

## Cost and safety

- SSE-S3 only; no KMS customer-managed key.
- No NAT Gateway, cross-region replication or AWS Backup in the core solution.
- Sample data is measured in kilobytes. Expect pennies for S3 requests and
  free-tier SNS/SQS usage. The demo stays comfortably under USD 1 if
  destroyed at the end.
- `force_destroy = true` is demo-only.
- The TLS-only bucket policy is enforced on real AWS.
- `.gitignore` excludes Node dependencies, Terraform provider caches,
  `*.tfstate*`, `*.tfplan`, local `*.tfvars` overrides, override files,
  `restored/`, the default generated manifest/report and logs.
  `infra/.terraform.lock.hcl` and the example variable file stay tracked on
  purpose.

## Validation performed

This implementation was exercised end to end on 2026-10-21 with Node.js
24.11.0, Terraform 1.9.8 and AWS provider 5.100.0.

The first real-AWS run used the optional email subscription. Evidence is in
`manifests/real-aws-manifest.json` and
`reports/real-aws-backup-status.md`.

| Check | Result |
| --- | --- |
| `terraform apply` | 15 resources created: S3, IAM, SNS, SQS and the email subscription |
| Bucket readback | Versioning `Enabled`; SSE `AES256`; all four public-access flags `true`; `BucketOwnerEnforced`; TLS-only policy; 7-day noncurrent lifecycle |
| Backup | 5/5 files; two successful runs with different `service-config.yaml` content |
| Versioning | At restore time `latest/service-config.yaml` had two versions; run 1's older version was restored by exact version ID |
| Restore | `RESTORE PASS`; 345 B; expected and actual SHA-256 both `f437f6a38da6...` |
| Verification | `VERIFICATION PASS` 5/5 files and 10/10 objects on the clean run |
| Failure alert | Simulated upload failed; backup exited 1; SNS `backup.failed` received in SQS |
| Verification alert | Failed run exited 1; SNS `backup.verification_failed` received in SQS |
| Missed-backup alert | Forced stale clock exited 1; SNS `backup.missed` received in SQS |
| Freshness | Normal check PASS; stale check FAIL as expected |
| TLS-only | Presigned HTTPS GET returned 200; the same URL over HTTP returned 403 |
| IAM policy simulation | List/Get/Put and SNS allowed; DeleteObject and DeleteObjectVersion implicit deny |
| Email subscription | Confirmed; test SNS publish accepted and mirrored to SQS |
| Report | 4 runs (3 success, 1 failed), 3 verifications, 1 recovery; live S3 24 current / 14 noncurrent versions |
| `terraform destroy` | 15 resources destroyed; bucket, topic, queue and IAM resources confirmed gone; state empty |

After simplifying to a single real-AWS path, the stack was applied and
exercised again without email:

| Post-cleanup check | Result |
| --- | --- |
| `terraform plan` / `apply` | 14 resources created with no email subscription; optional email plan showed exactly 1 additional subscription |
| Backup | 5/5 files uploaded |
| Verification | PASS 5/5 files and 10/10 objects |
| Restore | `RESTORE PASS` with matching SHA-256 |
| Freshness | PASS |
| Live report | Rendered from the new manifest and S3 version counts |
| Failure alert | Backup exited 1 and `backup.failed` was received in SQS |
| `terraform destroy` | 14 resources destroyed; state empty |

Static checks also passed: `npm run check`, `terraform fmt -check`,
`terraform validate` and `git diff --check`.

Remaining gaps: actual inbox receipt of the test email is external to the
automation; lifecycle expiry after 7 days was not waited for (the rule was
captured); and the IAM role is simulated rather than assumed because it is not
attached to compute.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `CredentialsProviderError` | Configure a real AWS profile, SSO session or role, then confirm with `aws sts get-caller-identity`. |
| `NoSuchBucket` | The demo bucket was destroyed. Apply Terraform again and re-export `BUCKET_NAME`. |
| `AccessDenied` | Check the active credentials, bucket policy and IAM policy. The TLS policy only allows HTTPS. |
| SNS message not in SQS | Confirm the SNS subscription exists; SQS messages may be invisible during the visibility timeout. |
| Lifecycle not expired after 7 days | S3 evaluates lifecycle rules asynchronously. Validate the rule, not the elapsed time immediately. |
| Email not received | Confirm the SNS email subscription in the inbox, then publish a test notification. |
| `terraform destroy` fails on non-empty bucket | Keep `force_destroy = true` for the demo, or empty all versions first. |

## Documentation

- [Architecture and optional AWS extensions](docs/architecture.md)
- [Backup policy](docs/backup-policy.md)
- [Disaster recovery plan](docs/disaster-recovery.md)
- [Evidence checklist](docs/evidence.md)
- [Limitations](docs/limitations.md)
