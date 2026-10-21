# Evidence Checklist

Capture terminal output or screenshots for every item below. The goal is to
prove the requirement, not just show that a command ran. Save files under
`docs/evidence/` with the suggested names, or paste the annotated output into
the final submission document.

Suggested naming:

```text
docs/evidence/01-terraform-apply.txt
docs/evidence/02-bucket-security.txt
docs/evidence/03-version-history.txt
docs/evidence/04-restore-pass.txt
docs/evidence/05-verify-pass.txt
docs/evidence/06-verify-corrupt.txt
docs/evidence/07-sns-sqs-alert.txt
docs/evidence/08-report-summary.png
docs/evidence/09-terraform-destroy.txt
```

## 0. Record the environment

```bash
cd submission/webies/automated-backup-versioning-04
node --version
terraform version
npm run check
terraform -chdir=infra fmt -check
terraform -chdir=infra validate
```

Capture the Node major version, Terraform version and the successful checks.
Do not capture the LocalStack license token or any AWS secret.

## 1. Provisioning

```bash
terraform -chdir=infra apply -auto-approve
terraform -chdir=infra output
terraform -chdir=infra state list
```

Capture:

- `Apply complete` with 14 resources (or 15 when the optional alarm is on).
- Outputs for `bucket_name`, `sns_topic_arn`, `iam_role_arn`, `region`,
  `sqs_queue_url`, `noncurrent_version_retention_days`.
- The state list showing the bucket, versioning, lifecycle, encryption,
  ownership, public access block, bucket policy, SNS topic, SQS queue,
  subscriptions, IAM role, IAM policy and attachment.

Set the shell variables used below:

```bash
export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
export BACKUP_ALERTS_TOPIC_ARN="$(terraform -chdir=infra output -raw sns_topic_arn)"
export ALERT_QUEUE_URL="$(terraform -chdir=infra output -raw sqs_queue_url)"

# LocalStack only:
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-east-1
```

For real AWS, do not export the two test credentials and do not set
`AWS_ENDPOINT_URL`.

## 2. Bucket security settings

LocalStack commands use `--endpoint-url "$AWS_ENDPOINT_URL"`. On real AWS,
remove that flag.

```bash
aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-bucket-versioning \
  --bucket "$BUCKET_NAME"

aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-bucket-encryption \
  --bucket "$BUCKET_NAME"

aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-public-access-block \
  --bucket "$BUCKET_NAME"

aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-bucket-ownership-controls \
  --bucket "$BUCKET_NAME"

aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-bucket-lifecycle-configuration \
  --bucket "$BUCKET_NAME"

aws --endpoint-url "$AWS_ENDPOINT_URL" s3api get-bucket-policy \
  --bucket "$BUCKET_NAME"
```

Expected evidence:

- Versioning status `Enabled`.
- Encryption rule with `SSEAlgorithm: AES256`.
- All four public-access flags `true`.
- Ownership rule `BucketOwnerEnforced`.
- Lifecycle rule `expire-noncurrent-versions` with `NoncurrentDays: 7`.
- Bucket policy contains `DenyInsecureTransport` and
  `aws:SecureTransport = false`.
- SNS/SQS resources exist in the Terraform output and state list.

## 3. Version history

```bash
node scripts/backup.mjs

rm -rf /tmp/webies-evidence-data
cp -r sample-data /tmp/webies-evidence-data
printf '\n# evidence version 2\n' >> /tmp/webies-evidence-data/service-config.yaml
node scripts/backup.mjs --source /tmp/webies-evidence-data

node scripts/restore.mjs --list --key latest/service-config.yaml
```

Capture the table with two rows for the same key: one current version and one
noncurrent version, with two different version IDs and sizes. This is the
proof that overwriting created a new version instead of replacing the old one.

If using AWS CLI instead, the equivalent is:

```bash
aws --endpoint-url "$AWS_ENDPOINT_URL" s3api list-object-versions \
  --bucket "$BUCKET_NAME" --prefix latest/ \
  --query 'Versions[].{Key:Key,VersionId:VersionId,IsLatest:IsLatest,Size:Size}'
```

## 4. Restore an earlier version

```bash
FIRST_RUN="$(node -e "const m=require('./manifests/manifest.json');console.log(m.runs[0].runId)")"
node scripts/restore.mjs --run-id "$FIRST_RUN" --file service-config.yaml \
  --out restored/service-config-v1.yaml
```

Capture the full output:

- `Source: ... (version <id>)`
- `Returned version: <id>` matching the requested version
- `Expected SHA-256` and `Actual SHA-256` matching
- `RESTORE PASS`

Also show the recovered file content:

```bash
sed -n '1,20p' restored/service-config-v1.yaml
```

It must not contain the `# evidence version 2` line. The script also appends a
passing recovery record to the manifest, which appears in the report.

## 5. Verification pass

```bash
node scripts/verify.mjs
```

Capture:

- One `PASS` line per file with `archive=ok latest=ok`.
- `VERIFICATION PASS: N/N files, 2N/2N objects.`
- The manifest path update.

The verification downloads the exact version IDs and compares the actual size
and SHA-256, so the terminal output is evidence of content integrity, not just
object existence.

## 6. Verification failure and corruption detection

First demonstrate a missing upload:

```bash
node scripts/backup.mjs --simulate-failure || echo "expected exit 1"
node scripts/verify.mjs || echo "expected verification failure"
```

Capture the `[fail]` line, the `VERIFICATION FAIL` summary and the exit-code
line. Then prove that a checksum mismatch is detected without altering the
real manifest:

```bash
cp manifests/manifest.json /tmp/webies-corrupt-manifest.json
RUN_ID="$(node -e "const m=require('./manifests/manifest.json');const r=[...m.runs].reverse().find(x=>x.status==='success');console.log(r.runId)")"
node -e "const fs=require('fs');const p='/tmp/webies-corrupt-manifest.json';const m=JSON.parse(fs.readFileSync(p,'utf8'));const r=m.runs.find(x=>x.runId===process.argv[1]);r.files[0].sha256='0'.repeat(64);fs.writeFileSync(p,JSON.stringify(m,null,2));" "$RUN_ID"
node scripts/verify.mjs --manifest /tmp/webies-corrupt-manifest.json --run-id "$RUN_ID" --no-alert || echo "expected checksum failure"
```

Capture the `sha256 mismatch` message and the failure summary. Delete the
temporary manifest afterwards. This proves the verification compares content,
not only object metadata.

## 7. SNS to SQS failure alert

```bash
node scripts/backup.mjs --simulate-failure || echo "expected exit 1"
node scripts/poll-alerts.mjs --queue-url "$ALERT_QUEUE_URL" --wait 10 \
  --delete --expect
```

Capture the SNS publish confirmation and the SQS message body. The body must
contain:

```json
{
  "event": "backup.failed",
  "runId": "...",
  "bucket": "...",
  "failedFiles": 1,
  "failures": [
    {
      "file": "archive/2026-Q3-summary.csv",
      "error": "simulated upload failed: ..."
    }
  ]
}
```

Run `verify.mjs` on the failed run to show a second event,
`backup.verification_failed`, and poll the queue again if desired.

LocalStack does not deliver real email. On real AWS, add
`-var="alert_email=you@example.com"`, confirm the subscription email, and
capture the received message plus the SNS subscription confirmation.

Optional alarm evidence:

```bash
terraform -chdir=infra apply -auto-approve -var="enable_cloudwatch_alarm=true"
export CLOUDWATCH_NAMESPACE="$(terraform -chdir=infra output -raw cloudwatch_metric_namespace)"
node scripts/backup.mjs --simulate-failure || true
```

Capture the alarm resource in Terraform and the `BackupFailures` metric
publish. Do not claim that LocalStack evaluated the alarm state or delivered
the alarm action unless the console actually shows it. Real AWS alarm state
transition and email delivery are the final external checks.

### Missed or stale backup check

The freshness check reads the local manifest, so it does not need a successful
S3 call. Run the normal check after a recent backup:

```bash
node scripts/check-freshness.mjs --max-age-hours 26
```

Prove the stale path deterministically with a future clock, then poll the
queue for the `backup.missed` event:

```bash
node scripts/check-freshness.mjs --max-age-hours 1 \
  --now 2030-01-01T00:00:00Z || echo "expected exit 1"
node scripts/poll-alerts.mjs --queue-url "$ALERT_QUEUE_URL" --wait 10 \
  --delete --expect
```

Capture the `[freshness] FAIL` line, the exit code and the SQS body. If you do
not want an alert during a dry run, add `--no-alert`; the exit code still
changes to 1. A scheduler or monitoring job must invoke this check; see the
scheduler limitation in `docs/limitations.md`.

## 8. Status report

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

Capture `reports/backup-status.md` and highlight:

- Total backup jobs, successful jobs and failed jobs.
- Successful and failed file counts.
- Last successful backup time.
- Verification status (PASS/FAIL and timestamp).
- Recovered file status (PASS/FAIL, source file, matching SHA-256).
- Archive and latest-mirror storage, plus live S3 current/noncurrent version
  counts and bytes.
- Retention: noncurrent versions after 7 days; incomplete multipart uploads
  after 1 day.
- Failure events table.

Also render the synthetic sample to prove report generation without AWS:

```bash
node scripts/report.mjs --manifest manifests/sample-manifest.json \
  --out reports/backup-status.sample.md
```

## 9. Destroy and cleanup

```bash
terraform -chdir=infra destroy -auto-approve
```

Capture the `Destroy complete` line and confirm the bucket is gone:

```bash
aws --endpoint-url "$AWS_ENDPOINT_URL" s3api head-bucket \
  --bucket "$BUCKET_NAME" || echo "bucket removed as expected"
```

Then remove the LocalStack container if it was started for the demo:

```bash
sudo docker rm -f webies-localstack
```

For real AWS, repeat `terraform destroy` with the same `-var` values used for
apply. Capture the destroy output before closing the account session.

## 10. Repository hygiene

```bash
git status --short submission/webies/automated-backup-versioning-04
git ls-files submission/webies/automated-backup-versioning-04 | \
  grep -E '(^|/)(node_modules|\.terraform)(/|$)|\.tfstate|terraform\.tfvars$' \
  && echo "UNEXPECTED TRACKED FILE" || echo "no generated/secret files tracked"

grep -RInE 'AKIA[0-9A-Z]{16}|ls-[A-Za-z0-9-]{20,}' \
  submission/webies/automated-backup-versioning-04 \
  --exclude-dir=node_modules --exclude-dir=.terraform \
  && echo "POSSIBLE SECRET FOUND" || echo "no token-like strings found"
```

Capture the results. Expected:

- Only intended source, documentation, sample data, manifest and report files
  are present.
- No `node_modules/`, `.terraform/`, `*.tfstate*`, `terraform.tfvars` or
  `crash.log` is tracked.
- No AWS access key ID (`AKIA...`) or LocalStack license token is present.
- `git status` does not show accidental changes outside the team folder.
