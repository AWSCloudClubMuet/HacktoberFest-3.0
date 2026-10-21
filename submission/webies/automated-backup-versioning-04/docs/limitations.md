# Limitations

This document separates what the demo actually proves from what LocalStack
can only approximate and from what the production design deliberately leaves
out. Do not present an approximation as a real AWS result.

## LocalStack fidelity

### SNS email delivery

LocalStack can create an email subscription, but it does not deliver real
email. The core demo therefore uses an SQS queue as the local subscriber and
`scripts/poll-alerts.mjs` to read the raw JSON message. On real AWS the same
SNS topic can have an email subscription, but the recipient must confirm the
subscription before messages are delivered.

Evidence that is valid locally: the SNS publish call succeeds and the SQS
queue contains the expected JSON. Evidence that is not valid locally: an inbox
screenshot or a claim that email works.

### IAM enforcement

LocalStack commonly accepts the conventional `test`/`test` credentials and may
not enforce the least-privilege IAM policy for S3 and SNS calls.
The Terraform policy is still created and can be inspected, but a successful
local upload does not prove that the role is sufficient or that an
over-permissioned role would fail.

Some LocalStack Pro configurations can enable IAM enforcement. If you enable
it, the scripts must assume or use a role with the policy; the default demo
does not do that. Real AWS is the authoritative IAM test. Treat the role as a
deliverable to be reviewed and attached to a real runtime, not as a local
security boundary that was exercised.

### Lifecycle timing

The lifecycle rule is created and can be read back. LocalStack does not wait
seven days or reliably run the same lifecycle scheduler as S3. A local
`get-bucket-lifecycle-configuration` proves the configuration, not that a
noncurrent version expired on day 7.

Real S3 evaluates lifecycle rules asynchronously, typically once per day, and
does not guarantee an exact expiration timestamp. The 7-day value is a policy
window, not a stopwatch. Plan retention with margin.

### TLS-only bucket policy

The bucket policy denies requests where `aws:SecureTransport` is false. Real
AWS enforces this. LocalStack serves plain HTTP on `localhost:4566` and may
not populate or evaluate that condition consistently, so local requests can
still succeed with the policy present.

This means the local demo does not prove TLS enforcement. The policy JSON is
the evidence locally; an HTTPS-only access test is the evidence on real AWS.

### S3 versioning and encryption

LocalStack implements version IDs and delete markers well enough for this
workflow, and the `AES256` encryption setting is stored. It does not reproduce
AWS durability, storage-class behavior, cross-region behavior or the actual
server-side encryption boundary. SSE-S3 is an AWS-managed encryption at rest,
not client-side encryption and not a KMS customer-managed key.

### Other service differences

- SNS/SQS quotas, retry behavior and visibility-timeout edge cases differ.
- SQS queue URLs may use a LocalStack host-style name; the poller rewrites
  the host to the configured edge endpoint.
- IAM policy simulation and AWS Organizations controls are out of scope.
- S3 event notifications, Object Lock, MFA delete and replication are not
  exercised.

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
| Role not attached to compute | The IAM role exists but the local CLI uses the operator's credentials. | Attach the role to Lambda/ECS/EC2 and change `backup_job_principal`. |
| Local reports | `reports/backup-status.md` is a file, not a hosted dashboard. | Publish it to S3 static hosting or a monitoring system; optional only. |
| Synthetic data | The sample contains no personal or regulated data. | Classify and review real data before extending the scope. |

## What was not validated locally

The following items cannot be proven by the LocalStack run. The 2026-10-21
real-AWS run covered the first three where noted:

- SNS email subscription confirmation and a test publish. The subscription was
  confirmed and SNS accepted the publish; actual inbox receipt remains
  external.
- TLS-only enforcement. HTTPS returned 200 and the same presigned URL over
  HTTP returned 403.
- IAM least-privilege policy. Policy simulation allowed List/Get/Put and SNS
  and denied Delete; actual role assumption remains untested because the role
  is not attached to compute.
- Real lifecycle expiration after the retention period. The 7-day rule was
  captured but not waited for.
- Cross-region behavior, AWS Backup and replication (not implemented).
- AWS service quotas, billing and account-level guardrails.

The LocalStack validation does cover: Terraform apply/validate, bucket
versioning, public access block, SSE-S3 configuration, ownership controls,
lifecycle configuration, version listing, upload of two versions, restore by
version ID with SHA-256 proof, manifest append, verification pass and failure,
SNS -> SQS delivery, report rendering and `terraform destroy`.

## Scope exclusions

The optional S3 report storage, cross-region replication, AWS Backup and
EventBridge/Lambda ideas are documented in `docs/architecture.md` as
extensions only. They are not implemented and are not claimed as evidence.
Adding them would require new Terraform resources, new IAM permissions and a
larger budget and test matrix.
