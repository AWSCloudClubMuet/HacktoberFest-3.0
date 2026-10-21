# Architecture

## Goal

Protect a small application dataset with a repeatable S3 backup process,
prove that every backup can be read back and checksum-matched, and document
how the design behaves when data is overwritten, deleted, corrupted or
affected by a regional outage.

The implementation is deliberately small: Terraform provisions the storage,
security and alert resources; four Node scripts perform backup, verification,
restore and reporting; a fifth script reads the local alert queue.

## Component view

```text
                      +---------------------------------------+
                      | Operator / scheduled job              |
                      | node scripts/backup.mjs               |
                      +-------------------+-------------------+
                                          |
                    PutObject (AES256)    |    SNS Publish on failure
                                          v
 +--------------------------------------------------------+     +-------------------+
 | S3 bucket: private, versioned, SSE-S3, TLS-only policy |     | SNS topic         |
 |                                                        |     | backup-alerts     |
 |  backups/<run-id>/<relative-path>   immutable copy     |     +----+---------+----+
 |  latest/<relative-path>             overwritten mirror |          |         |
 |                                                        |          v         v
 |  lifecycle: noncurrent versions expire after 7 days    |     +---------+ +--------+
 +---------------------------+----------------------------+     | SQS     | | email  |
                             |                                  | (local) | | (AWS)  |
                             | GetObject(VersionId)             +---------+ +--------+
                             v
 +--------------------------------------------------------+
 | verify.mjs  -> download, size + SHA-256 compare        |
 | restore.mjs -> download one version, checksum proof    |
 | report.mjs  -> Markdown status from manifest + S3      |
 +--------------------------------------------------------+
                             |
                             v
                  manifests/manifest.json
                  reports/backup-status.md
```

The optional CloudWatch alarm watches a custom `BackupFailures` metric and
publishes to the same SNS topic. It is disabled by default and is not required
for the local demo because LocalStack alarm evaluation is not a reliable
substitute for the SQS proof.

## Components

| Component | Terraform resource | Purpose |
| --- | --- | --- |
| Backup bucket | `aws_s3_bucket.backup` | Stores timestamped run copies and the `latest/` mirror. `bucket_prefix` adds a unique suffix. |
| Public access block | `aws_s3_bucket_public_access_block.backup` | Blocks public ACLs and policies, ignores public ACLs, restricts public buckets. |
| Ownership controls | `aws_s3_bucket_ownership_controls.backup` | `BucketOwnerEnforced`; ACLs are disabled and the bucket owner owns all objects. |
| Encryption | `aws_s3_bucket_server_side_encryption_configuration.backup` | SSE-S3 (`AES256`) by default; no KMS key and no KMS request charges. |
| Versioning | `aws_s3_bucket_versioning.backup` | Every overwrite of `latest/` keeps the previous object as a noncurrent version. |
| Lifecycle | `aws_s3_bucket_lifecycle_configuration.backup` | Expire noncurrent versions after 7 days; abort incomplete multipart uploads after 1 day. |
| TLS policy | `aws_s3_bucket_policy.backup` | Deny all S3 actions when `aws:SecureTransport` is false. |
| Backup IAM role | `aws_iam_role.backup` | Trusts the configured service principal (default `lambda.amazonaws.com`). |
| Backup policy | `aws_iam_policy.backup` | List bucket/versions, get/put objects, publish alerts, optional metrics. |
| Alert topic | `aws_sns_topic.backup_alerts` | Receives failed backup and failed verification events. |
| Alert queue | `aws_sqs_queue.backup_alerts` | Local, inspectable subscriber; proves the SNS path without email. |
| Queue policy | `aws_sqs_queue_policy.backup_alerts` | Allows only the matching SNS topic to send messages. |
| Subscriptions | `aws_sns_topic_subscription.sqs`, `.email` | SQS always; email only when `alert_email` is set. |
| Alarm (optional) | `aws_cloudwatch_metric_alarm.backup_failures` | Fires when `BackupFailures` is at least 1 in a 5-minute period. |

## Data flow

1. `backup.mjs` lists every regular file under `sample-data/` (or `--source`).
2. For each file it computes SHA-256 and size, then uploads:
   - `backups/<run-id>/<relative-path>` for an immutable per-run copy;
   - `latest/<relative-path>` as a stable mirror. Because versioning is on,
     re-uploading the same mirror key creates a new version.
3. Both objects carry `sha256`, `source-file`, `backup-run-id` and
   `backup-kind` metadata. The upload explicitly requests `AES256`.
4. The run is appended to `manifests/manifest.json` with keys, version IDs,
   checksums, sizes, status and error details. Writes are atomic
   (`tmp` file + rename).
5. If any file failed, the script publishes a JSON alert to SNS and exits 1.
6. `verify.mjs` downloads every recorded archive and latest version by exact
   `VersionId`, recomputes SHA-256 and size, and compares them with the
   manifest. It appends a verification record and alerts on failure.
7. `restore.mjs` downloads one exact version, writes it under `restored/`,
   recomputes SHA-256 and compares it with the manifest value. It appends a
   recovery record.
8. `report.mjs` renders the manifest into Markdown. `--live` also pages
   through `ListObjectVersions` to report real current/noncurrent counts and
   bytes.
9. `check-freshness.mjs` compares the latest successful run with a maximum
   age and alerts on `backup.missed`. It is intended to be invoked by a
   scheduler or monitoring job.

## S3 key layout

| Key pattern | Written by | Meaning |
| --- | --- | --- |
| `backups/<run-id>/<relative-path>` | `backup.mjs` | One immutable copy for one run. Each run has a unique timestamp + random suffix. |
| `latest/<relative-path>` | `backup.mjs` | Stable mirror of the most recent content. Overwrites create versions. |
| `reports/...` | Not implemented | IAM is prepared for an optional report upload, but the core writes reports locally. |

`<run-id>` is an ISO-8601 timestamp with separators removed plus 8 random hex
characters, for example `20261021T062253222Z-d4b5f98d`. The corresponding key
is `backups/20261021T062253222Z-d4b5f98d/customers.csv`.

## Security model

- The bucket is private. Block Public Access is fully enabled.
- ACLs are disabled with `BucketOwnerEnforced`.
- Objects are encrypted with SSE-S3 and uploads explicitly request `AES256`.
- The bucket policy rejects plaintext HTTP. LocalStack runs on HTTP and may
  not evaluate the condition; real AWS does.
- The backup role has no delete permissions and no wildcard bucket access.
  It can list the bucket, get/put objects, list versions, publish to the
  alert topic, and put the optional failure metric in one namespace.
- Scripts use the standard AWS credential chain. No access key, secret key,
  session token or LocalStack license token appears in source, Terraform or
  documentation.
- SNS to SQS is restricted by a queue policy with an `aws:SourceArn`
  condition.
- Terraform state, provider caches, `terraform.tfvars`, `node_modules` and
  restored files are gitignored.

The IAM role is attached to no compute by default because the demo runs as a
local CLI. For a scheduled deployment, attach the role to a Lambda function,
ECS task or EC2 instance and change `backup_job_principal` to the matching
service principal.

## LocalStack and real AWS

The Terraform provider is selected by one variable:

- `use_localstack = true` (default): sets S3, SNS, SQS, IAM, STS and
  CloudWatch endpoints to `localstack_endpoint`, enables path-style S3, and
  skips account/credential validation. `AWS_ACCESS_KEY_ID=test` and
  `AWS_SECRET_ACCESS_KEY=test` are exported by the operator.
- `use_localstack = false`: all endpoints are null, so the provider uses
  normal AWS endpoints and the standard credential chain.

The Node code uses `AWS_ENDPOINT_URL` only. When set, the S3 client uses that
endpoint and `forcePathStyle: true`. When unset, it uses virtual-hosted-style
requests and normal AWS endpoints. No application code changes are needed to
switch environments.

## Failure and alert design

- Every file upload is attempted independently. A failure is recorded and the
  remaining files still upload, so one bad file does not discard a run.
- SNS receives `backup.failed`, `backup.verification_failed` and
  `backup.missed` JSON events with the run ID, bucket, failure details and
  manifest path.
- SQS uses raw message delivery, so the queue body is the original JSON.
- The same SNS topic can have an email subscription on real AWS. The email
  must be confirmed before delivery works.
- The optional CloudWatch alarm uses `BackupFailures`; `backup.mjs`,
  `verify.mjs` and `check-freshness.mjs` publish the metric only when
  `CLOUDWATCH_NAMESPACE` is set.
- `check-freshness.mjs` detects a missed backup by comparing the latest
  successful manifest run with a configurable age limit (default 26 hours).
  It exits 1 and publishes `backup.missed` when the data is stale. It still
  has to be invoked by a scheduler or monitoring system; the core does not
  deploy that scheduler. If the scheduler itself never runs, an external
  dead-man's switch is required. EventBridge/Lambda is documented as an
  optional extension.

## Availability and recovery trade-offs

- Versioning protects against overwrite and ordinary delete operations.
- Lifecycle expiry is intentional: noncurrent versions disappear after 7 days
  in the demo, so the recovery window is 7 days for noncurrent versions.
- The bucket is single-region. It does not survive a full regional outage.
  Cross-region replication or AWS Backup is required for that, and is listed
  as an optional extension only.
- The manifest is local. If the workspace is lost, the bucket may still hold
  the objects, but the expected checksums and version IDs are lost. The
  optional report/manifest S3 location is described in the bonus section.

## Optional AWS extensions (documented only, not implemented)

These are deliberately outside the core solution because the demo must remain
small, cheap and fully testable under LocalStack.

| Extension | How it would fit | Why it is not in the core |
| --- | --- | --- |
| Amazon ECR | Store a container image for the backup runner and pin the image digest for scheduled jobs. | No container runtime is needed for a local Node script. |
| Amazon Inspector | Scan the runner image or EC2/ECS compute for CVEs before deployment. | Adds a paid/complex scanning pipeline and no runtime compute exists. |
| S3 report storage | Upload `reports/backup-status.md` and the manifest to a separate `reports/` prefix or a separate bucket after each run. | The demo reports locally for easy review; IAM already permits PutObject under `reports/`. |
| Cross-region replication | Replicate the versioned bucket to a second region with replication rules and a replica KMS/SSE policy. | Adds a second region, replication IAM, storage and transfer cost; regional failover is outside a 5-hour demo. |
| AWS Backup | Create a backup plan and vault for a second, independent recovery copy. | The issue asks for a small S3 versioning demo; AWS Backup adds a vault and plan that LocalStack does not faithfully emulate. |
| EventBridge + Lambda | Run `backup.mjs` on a schedule inside Lambda and emit a success heartbeat for a dead-man's-switch alarm. | Requires packaging, a Lambda role/trust change, and scheduled invocation; the core role is ready but no compute is deployed. |

If these are added later, keep the least-privilege role scoped to the new
bucket, prefix and topic rather than granting wildcard S3 access.

## Cost notes

- S3 storage for the five sample files is negligible.
- SNS and SQS are within the free tier for this volume.
- SSE-S3 avoids KMS key and request charges.
- The optional custom metric and alarm cost roughly USD 0.40 per month; they
  are disabled by default.
- No NAT Gateway, cross-region replication or AWS Backup resources are created.
