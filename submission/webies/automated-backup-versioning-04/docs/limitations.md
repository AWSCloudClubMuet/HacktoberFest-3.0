# Limitations

This document separates what the demo actually proves from what remains
untested or deliberately out of scope. Do not present an unverified
assumption as a real AWS result.

## Verification boundaries

### SNS email delivery

The SNS topic can have an email subscription. The 2026-10-21 real-AWS run
confirmed the subscription and SNS accepted a test publish. Actual inbox
receipt is external to the automation and is not claimed as evidence.

SQS is the durable, inspectable subscriber: the queue contains the raw JSON
event, and `scripts/poll-alerts.mjs` reads it without depending on email.

### IAM enforcement

The Terraform policy is created and was checked with
`aws iam simulate-principal-policy`. The simulation allowed bucket listing,
object reads and writes, and SNS publishing, and returned implicit deny for
`DeleteObject` and `DeleteObjectVersion`.

The role is not attached to compute in the demo, so actual role assumption and
runtime enforcement were not exercised. The operator CLI uses its own
credentials. Treat the role as a deliverable to be reviewed and attached to a
real runtime, not as a security boundary that was exercised end to end.

### Lifecycle timing

The lifecycle rule is created and can be read back. The 7-day rule was not
waited for, and S3 evaluates lifecycle rules asynchronously, typically once
per day, without an exact expiration timestamp. The 7-day value is a policy
window, not a stopwatch. Plan retention with margin.

### TLS-only bucket policy

The bucket policy denies requests where `aws:SecureTransport` is false. The
real-AWS run proved this with a presigned URL: HTTPS returned 200 and the same
URL over HTTP returned 403.

### S3 versioning and encryption

The real-AWS run proved version IDs, noncurrent versions and restore by exact
version ID. It did not reproduce AWS durability across availability zones or a
regional outage. SSE-S3 is AWS-managed encryption at rest, not client-side
encryption and not a KMS customer-managed key.

### Other service differences

- SNS/SQS quotas, retry behavior and visibility-timeout edge cases were not
  exhaustively tested.
- IAM policy simulation does not replace a runtime test with the actual role.
- S3 event notifications, Object Lock, MFA delete and replication are not
  exercised.
- AWS Organizations controls, service quotas and billing guardrails are out of
  scope.

## Application limitations

| Limitation | Effect | Mitigation if the project continues |
| --- | --- | --- |
| Single region | A regional outage can make the bucket unavailable and there is no automatic failover. | Add cross-region replication or AWS Backup, test a failover. |
| No deployed scheduler | The demo's RPO is the last manual run; no backup happens automatically and a run that never starts cannot publish a failure event. | Add EventBridge + Lambda or an external scheduler; invoke `check-freshness.mjs` after the expected window and add an external dead-man's-switch if the scheduler itself can fail silently. |
| Local manifest only | Losing the workspace loses expected checksums and version IDs, even if objects remain. | Upload the manifest/report to a durable S3 prefix or a separate account. |
| Whole-file upload in memory | Large files can exhaust memory; multipart upload is not used. | Add `@aws-sdk/lib-storage` or stream a file to a multipart upload. The five sample files are small. |
| Single writer | Two concurrent backup runs can race when updating the manifest. | Add a lock (DynamoDB, S3 conditional write or a job queue). |
| No automatic retry beyond the SDK | A transient failure marks the file failed; the operator must re-run. | Add bounded retries with backoff and a failure budget. |
| No Object Lock / WORM | An identity with delete permissions can remove all versions and bypass retention. | Use S3 Object Lock in a separate account, or AWS Backup with a vault lock. |
| No MFA delete | A compromised administrator can delete versions. | Enable MFA delete for high-value buckets and restrict root use. |
| No KMS customer-managed key | Account-level readers can decrypt SSE-S3 data. | Use SSE-KMS with a tightly scoped key policy if required; this was excluded to stay under budget. |
| `force_destroy = true` | `terraform destroy` deletes every version, which is convenient for the demo and unsafe for real data. | Set `force_destroy = false` for retained data and require an approved deletion process. |
| Role not attached to compute | The IAM role exists but the operator CLI uses its own credentials. | Attach the role to Lambda/ECS/EC2 and change `backup_job_principal`. |
| Local reports | `reports/backup-status.md` is a file, not a hosted dashboard. | Publish it to S3 static hosting or a monitoring system; optional only. |
| Synthetic data | The sample contains no personal or regulated data. | Classify and review real data before extending the scope. |

## What was not proven

The 2026-10-21 real-AWS run covered the core requirements, but the following
remain unproven or out of scope:

- Actual inbox receipt of the SNS email test. The subscription was confirmed
  and SNS accepted the publish.
- Actual lifecycle expiration after the retention period. The 7-day rule was
  captured but not waited for.
- Actual role assumption and runtime IAM enforcement. The policy was
  simulated, and the role is not attached to compute.
- Cross-region behavior, AWS Backup and replication (not implemented).
- AWS service quotas, billing and account-level guardrails.

The real-AWS run did cover: Terraform apply/validate, bucket versioning,
public access block, SSE-S3 configuration, ownership controls, lifecycle
configuration, version listing, upload of two versions, restore by version ID
with SHA-256 proof, manifest append, verification pass and failure, SNS to SQS
delivery, report rendering, TLS-only enforcement, IAM policy simulation and
`terraform destroy`.

## Scope exclusions

The optional S3 report storage, cross-region replication, AWS Backup and
EventBridge/Lambda ideas are documented in `docs/architecture.md` as
extensions only. They are not implemented and are not claimed as evidence.
Adding them would require new Terraform resources, new IAM permissions and a
larger budget and test matrix.
