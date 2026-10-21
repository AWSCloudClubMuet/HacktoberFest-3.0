# Automated Backup, Versioning, and Disaster Recovery on AWS

A small, working reference implementation for HacktoberFest 3.0 issue #4. It
backs up a sample dataset to a private, versioned S3 bucket, verifies every
upload with SHA-256, restores an exact object version, reports backup status,
and sends failure alerts through SNS to an SQS subscriber (or email on real
AWS).

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
- Publishes failure alerts to SNS; SQS receives them locally, and an optional
  email subscription can receive them on real AWS.
- Detects a missed or stale backup by checking the age of the latest
  successful run in the manifest, with an optional `backup.missed` SNS alert.
- Generates `reports/backup-status.md` with job counts, last success,
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
 | verify.mjs     |   | SNS topic      |-->| SQS queue (local)    |
 | restore.mjs    |   |                |-->| email (real AWS)     |
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
- LocalStack Pro 2026.10 (validated) at `http://localhost:4566`.
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
    providers.tf              LocalStack / real-AWS switch
    variables.tf              Inputs and validation
    main.tf                   S3, lifecycle, IAM, SNS, SQS
    outputs.tf                Bucket, topic, role, region, queue
    terraform.tfvars.example  Copy for local overrides
    .terraform.lock.hcl       Provider checksums (commit this file)
  scripts/
    backup.mjs                Upload, checksum, manifest, failure alert
    verify.mjs                Download and compare size / SHA-256
    restore.mjs               List versions, restore one version, verify
    report.mjs                Render reports/backup-status.md
    poll-alerts.mjs           Receive SNS alerts from the SQS queue
    check-freshness.mjs       Detect a missed or stale backup from the manifest
    lib/
      s3.mjs                  S3 client, checksum, manifest helpers
      cli.mjs                 Dependency-free argument parser
      alerts.mjs              SNS failure-alert helpers
  sample-data/                Five synthetic files, including a subdirectory
  manifests/
    sample-manifest.json      Synthetic data for offline report rendering
    manifest.json             Created by backup.mjs (evidence from a real run)
  reports/
    backup-status.md          Latest generated status report
    backup-status.sample.md   Offline sample render
  docs/
    architecture.md
    backup-policy.md
    disaster-recovery.md
    evidence.md
    limitations.md
```

## Prerequisites

- Node.js 20 or newer (`node --version`).
- Terraform 1.6 or newer (`terraform version`).
- Docker and a LocalStack Pro license for the local path.
- AWS credentials with permission to create S3, IAM, SNS and SQS resources
  for the real-AWS path.

The AWS CLI is optional. It is used only for read-only inspection commands in
`docs/evidence.md`; all backup, verification, restore and reporting operations
are implemented with Node.js and AWS SDK v3.

## LocalStack Pro: full local run

Run these commands from the team folder:

```bash
cd submission/webies/automated-backup-versioning-04
```

### 1. Start LocalStack Pro

The license token must come from the environment. Do not write it into a file,
shell history, Terraform variable or README.

```bash
export LOCALSTACK_AUTH_TOKEN='<your-license-token>'
sudo docker run -d --name webies-localstack \
  -p 4566:4566 \
  -e LOCALSTACK_AUTH_TOKEN \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack-pro:latest
```

If your user can run Docker without `sudo`, omit `sudo`. If you use the
LocalStack CLI instead, `localstack start -d` is equivalent. Wait for health:

```bash
curl -s http://localhost:4566/_localstack/health | head -c 200
```

### 2. Install Node dependencies and configure the shell

```bash
npm install

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
```

`test`/`test` are the conventional LocalStack credentials, not real secrets.
The Node S3 client reads `AWS_ENDPOINT_URL` and switches to
`forcePathStyle: true`; unset it for real AWS.

### 3. Provision and export resource names

```bash
terraform -chdir=infra init
terraform -chdir=infra fmt -check
terraform -chdir=infra validate
terraform -chdir=infra apply -auto-approve

export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
export BACKUP_ALERTS_TOPIC_ARN="$(terraform -chdir=infra output -raw sns_topic_arn)"
export ALERT_QUEUE_URL="$(terraform -chdir=infra output -raw sqs_queue_url)"
```

The default `use_localstack = true` sends all provider traffic to
`http://localhost:4566`. Local state is used. `.terraform/`, all `.tfstate`
files, `terraform.tfvars` and `crash.log` are ignored by Git.

### 4. Run the core workflow

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

`report.mjs --live` queries S3 for real current/noncurrent version counts and
bytes. Without `--live`, it renders from the manifest only and is fully
offline.

### 5. Prove version history and restore an earlier version

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

### 6. Simulate a failure and verify the alert path

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

Check that the latest successful run is fresh. In production this command
would run from cron, CI, EventBridge or another scheduler after the expected
backup window:

```bash
node scripts/check-freshness.mjs --max-age-hours 26
```

To prove the stale path without waiting, force a future clock and suppress the
alert. This exits 1, as an alerting job should:

```bash
node scripts/check-freshness.mjs --max-age-hours 1 \
  --now 2030-01-01T00:00:00Z --no-alert || echo "expected exit code 1"
```

### 7. Clean up LocalStack

```bash
terraform -chdir=infra destroy -auto-approve
sudo docker rm -f webies-localstack
```

Confirm the bucket is gone with the `head-bucket` command in
`docs/evidence.md`. The local report and manifest remain as historical
evidence.

## Real AWS: final evidence run

Use a dedicated demo account or a sandbox account. The bucket is created with
a unique suffix and `force_destroy = true` for demo cleanup.

```bash
cd submission/webies/automated-backup-versioning-04

# Do not reuse the LocalStack test credentials.
unset AWS_ENDPOINT_URL
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
export AWS_PROFILE='<your-profile>'
export AWS_REGION=us-east-1

aws sts get-caller-identity
terraform -chdir=infra init
terraform -chdir=infra apply -auto-approve \
  -var="use_localstack=false" \
  -var="alert_email=you@example.com"

export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
export BACKUP_ALERTS_TOPIC_ARN="$(terraform -chdir=infra output -raw sns_topic_arn)"
export ALERT_QUEUE_URL="$(terraform -chdir=infra output -raw sqs_queue_url)"
```

Confirm the SNS email subscription before relying on email delivery. The SQS
queue receives the same alert without confirmation.

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
node scripts/poll-alerts.mjs --queue-url "$ALERT_QUEUE_URL" --wait 20 --delete
```

To test the failure path, run `node scripts/backup.mjs --simulate-failure`,
poll the queue, then run a clean backup. Real email delivery is the item that
cannot be proven locally.

### Real AWS cleanup

```bash
terraform -chdir=infra destroy -auto-approve \
  -var="use_localstack=false" \
  -var="alert_email=you@example.com"
```

Use the same `-var` values you applied with.

`force_destroy = true` lets Terraform delete every object version. That is
convenient for the demo and dangerous for real backups; set it to `false` for
retained data and delete objects through an approved retention process.

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
| Destroy LocalStack stack | `terraform -chdir=infra destroy -auto-approve` |

All scripts accept `--help`, use `--bucket` or `BUCKET_NAME`, and read
credentials from the standard AWS credential chain. No script contains an
access key, secret key or license token.

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
| 9. Visualization and reporting | `scripts/report.mjs`, `reports/backup-status.md` | Report summary screenshot |
| 10. AWS integration bonus | Documented only in `docs/architecture.md` and `docs/limitations.md` | Written design, no implementation claim |

## Cost and safety

- SSE-S3 only; no KMS customer-managed key.
- No NAT Gateway, cross-region replication or AWS Backup in the core solution.
- Sample data is measured in kilobytes. The whole LocalStack demo costs
  nothing beyond the existing LocalStack Pro license.
- On real AWS, expect pennies for S3 requests and free-tier SNS/SQS usage.
  The demo stays comfortably under USD 1 if destroyed at the end.
- `force_destroy = true` is demo-only.
- The TLS-only bucket policy is enforced on real AWS. LocalStack serves HTTP
  on localhost and may not evaluate `aws:SecureTransport`; see
  `docs/limitations.md`.
- `.gitignore` excludes Node dependencies, Terraform provider caches,
  `*.tfstate*`, `*.tfplan`, local `*.tfvars` overrides, override files,
  `restored/` and logs. `infra/.terraform.lock.hcl` and the example variable
  file stay tracked on purpose.

## Validation performed

This implementation was exercised end to end on 2026-10-21 with Node.js
24.11.0, Terraform 1.9.8, AWS provider 5.100.0 and LocalStack Pro 2026.10.0.
The checks below passed in this workspace:

| Check | Result |
| --- | --- |
| `terraform -chdir=infra fmt -check` | Pass |
| `terraform -chdir=infra init` / `validate` | Pass |
| `terraform -chdir=infra apply` | Pass; 14 resources with no email subscription |
| Bucket settings read back from S3 | Versioning `Enabled`; SSE `AES256`; all four public-access flags `true`; `BucketOwnerEnforced`; lifecycle noncurrent 7 days; TLS-only policy present |
| Backup run 1 | 5/5 files uploaded, SHA-256 recorded |
| Backup run 2 with changed `service-config.yaml` | 5/5 uploaded; the `latest/` key gained a second version |
| Restore run 1 `service-config.yaml` | `RESTORE PASS`; returned version matched; expected and actual SHA-256 matched; restored output was 345 bytes |
| Verification of run 2 | `VERIFICATION PASS`, 5/5 files and 10/10 objects |
| Simulated upload failure | Backup exited 1, recorded the failed file on S3 error, and published `backup.failed` to SNS; SQS received the JSON alert |
| Verification of the failed run | Exited 1 with 4/5 files and 8/10 objects; published `backup.verification_failed`; SQS received the second alert |
| Missed-backup freshness check | Fresh manifest passed; a forced future clock with a 1-hour limit exited 1 and sent one `backup.missed` SNS publish with the expected payload in a local protocol mock. The SQS delivery path is shared with the proven failure alerts |
| Corrupt-manifest test | A temporary manifest with a zeroed expected hash was rejected with `sha256 mismatch`; the real manifest was not changed |
| Report generation | `reports/backup-status.md` rendered 4 jobs (3 success, 1 failed), last verification PASS, last recovery PASS and live S3 version counts; the sample manifest also renders offline |
| `npm run check` | All `.mjs` files passed `node --check` |
| ASCII scan | No non-ASCII characters in source or documentation |
| `terraform destroy` | Passed for the 14-resource stack |

The validation stack and LocalStack container are destroyed after capture, so
the bucket name and version IDs in `manifests/manifest.json` are historical
evidence rather than a live endpoint. Re-run the commands in this README to
reproduce them.

The following still require the real-AWS evidence run: SNS email confirmation
and delivery, IAM enforcement, actual lifecycle expiration after 7 days, and
HTTPS-only enforcement. The LocalStack setup cannot prove those items; see
`docs/limitations.md`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ECONNREFUSED` / endpoint error | Start LocalStack and check `AWS_ENDPOINT_URL=http://localhost:4566`. |
| `CredentialsProviderError` | Export the LocalStack test credentials, or configure a real AWS profile/role. |
| `NoSuchBucket` | The demo bucket was destroyed. Apply Terraform again and re-export `BUCKET_NAME`. |
| `AccessDenied` | Check the active credentials, bucket policy and IAM policy. The TLS policy only allows HTTPS on real AWS. |
| SNS message not in SQS | Confirm the SNS subscription exists; SQS messages may be invisible during the visibility timeout. |
| Lifecycle not expired after 7 days | Real S3 evaluates lifecycle daily; LocalStack does not wait 7 days. Validate the rule, not the elapsed time. |
| Email not received | Confirm the SNS email subscription in the inbox; LocalStack does not deliver email. |
| `terraform destroy` fails on non-empty bucket | Keep `force_destroy = true` for the demo, or empty all versions first. |

## Documentation

- [Architecture and optional AWS extensions](docs/architecture.md)
- [Backup policy](docs/backup-policy.md)
- [Disaster recovery plan](docs/disaster-recovery.md)
- [Evidence checklist](docs/evidence.md)
- [Limitations and LocalStack fidelity](docs/limitations.md)
