# Disaster Recovery Plan

## Objectives

| Objective | Target | Basis |
| --- | --- | --- |
| Recovery time objective (RTO) - single file | 1 hour | The bucket and version IDs are known, one operator can run `restore.mjs`, and only one small file is involved. |
| Recovery time objective (RTO) - full dataset | 4 hours | Recreate the bucket with Terraform, restore each file, re-run verification and reporting. Assumes the manifest and source data are available. |
| Recovery point objective (RPO) - scheduled target | 24 hours | Daily backup at 02:00 UTC. A failure at 01:59 UTC can lose almost 24 hours of changes. |
| Recovery point objective (RPO) - demo actual | Last successful backup | The hackathon demo has no deployed scheduler, so the RPO is the time of the last manual successful run. |
| Noncurrent version recovery window | 7 days | Lifecycle expiry is set to 7 days for the demo. After that, noncurrent versions are gone. |
| Alert detection | 5 minutes after a failed run / next queue poll | SNS publishes immediately and the SQS queue makes the alert inspectable. |

These targets are commitments for the demo scenario, not a production SLA.
They must be re-approved if the dataset, schedule, region or retention window
changes.

## Scope and assumptions

- The backup bucket, IAM role, SNS topic and SQS queue are created by
  Terraform in one AWS account and one region.
- The manifest and reports live in the workspace. They are not replicated.
- The source dataset is small enough to upload with one `PutObject` per file.
- The operator has working AWS credentials and Terraform state for the demo.
- A regional failure is out of scope for automatic recovery. There is no
  cross-region replication or AWS Backup vault in the core solution.
- LocalStack proves the workflow and checksum logic, not AWS durability or
  email delivery.

## How the controls reduce risk

| Control | Risk reduced | What the core solution does | Remaining limit |
| --- | --- | --- | --- |
| S3 versioning | Accidental overwrite and ordinary deletion | Every upload creates a version; a delete adds a delete marker and leaves earlier versions addressable | Same bucket and account; a delete-everything identity can still remove history |
| Lifecycle retention | Unbounded storage and unclear recovery window | Noncurrent versions expire after 7 days; incomplete multipart uploads abort after 1 day | Short demo window; extend it for production and document the change |
| Least-privilege IAM | Compromised runner or accidental delete | Backup role can put objects under the backup prefix and publish alerts; it has no delete permission | The local demo uses operator credentials; attach the role to compute for enforcement |
| Separate run copies | A corrupt or overwritten `latest/` object | Each run writes an immutable `backups/<run-id>/` copy in addition to the `latest/` mirror | Run copies share the bucket and account, so they are not an independent recovery copy |
| Separate recovery copy (production) | Bucket deletion, account compromise or regional failure | Not part of the core; cross-region replication, AWS Backup or a second account are documented extensions | Requires extra cost, IAM and a tested failover procedure |

Versioning and retention preserve recoverable history, while least-privilege
permissions limit the blast radius of the runner. A truly separate recovery
copy is the only control that survives deletion of the bucket, compromise of
the account, or a regional outage; the demo documents that gap rather than
claiming the same-bucket run copies provide it.

## Recovery scenarios

### Scenario 1: An incorrect update overwrote a file

This is the primary demo scenario. The `latest/` mirror has two versions:
the bad update is current and the good content is a noncurrent version.

1. Read the manifest and find the last known-good run.
2. Verify that run:

   ```bash
   node scripts/verify.mjs --run-id <good-run-id>
   ```

3. List versions of the affected key:

   ```bash
   node scripts/restore.mjs --list --key latest/service-config.yaml
   ```

4. Restore the version from the good run:

   ```bash
   node scripts/restore.mjs --run-id <good-run-id> --file service-config.yaml \
     --out restored/service-config.yaml
   ```

   Or restore by explicit key and version:

   ```bash
   node scripts/restore.mjs --key latest/service-config.yaml \
     --version-id <good-version-id> --out restored/service-config.yaml
   ```

5. Confirm `RESTORE PASS`, the returned version ID and the matching expected
   and actual SHA-256 values.
6. Regenerate the report:

   ```bash
   node scripts/report.mjs --live
   ```

7. Replace the bad application copy with the recovered file through the
   normal application change process. The demo proves the recovered bytes;
   pushing them back into a production path is an application decision.

### Scenario 2: An object was deleted

A normal `DeleteObject` on a versioned bucket adds a delete marker. The
previous versions remain addressable.

1. `restore.mjs --list --key <key>` to see the delete marker and earlier
   versions.
2. Restore the version immediately before the delete marker.
3. Verify the SHA-256.
4. If the object must be current again, upload the recovered bytes to the
   original key with the application's normal writer or a controlled admin
   operation. Do not delete the delete marker without recording the change.
5. Re-run verification and reporting.

### Scenario 3: Verification finds a corrupt or incomplete backup

1. Do not overwrite the manifest or delete the failed objects; they are
   evidence.
2. Run `verify.mjs` for the previous successful run:

   ```bash
   node scripts/verify.mjs --run-id <previous-good-run-id>
   ```

3. If the previous run passes, restore from that run and continue.
4. If multiple runs fail, check credentials, endpoint, bucket policy and
   upstream source changes before retrying.
5. Record the incident and add a prevention action, such as a pre-upload
   checksum review or a larger SDK retry budget.

### Scenario 4: The bucket or all versions were deleted

This is the worst case. Versioning does not protect against an identity that
can delete every version, and `force_destroy = true` intentionally permits
Terraform to do so.

1. Stop the backup job to prevent a new empty history from being mistaken for
   a healthy one.
2. Check CloudTrail for `DeleteBucket`, `DeleteObjectVersion` and IAM changes.
3. If a separate copy exists (not part of the core solution), restore from
   that copy.
4. If no copy exists, rebuild the bucket with Terraform, restore what can be
   recovered from the source application, and record the data loss.
5. Review the residual-risk controls below. Object Lock, a separate account
   and cross-region replication are the recommended production fixes, but
   they are out of scope for this demo.

### Scenario 5: Credentials are compromised

1. Disable or rotate the exposed access key, session or role.
2. Revoke the LocalStack test credentials from the shell; they are not valid
   on real AWS but should still be removed from shared terminals.
3. Inspect CloudTrail for S3, IAM and SNS changes.
4. Compare the latest manifest with `restore.mjs --list` for unexpected
   versions and delete markers.
5. Restore known-good versions and re-run verification.
6. Review the IAM policy. The backup role intentionally has no delete
   permission, but an administrator or a stolen operator profile may.

### Scenario 6: The region is unavailable

The bucket is single-region. If the region is unavailable:

- The RTO is undefined until the region recovers, because there is no
  replica in another region.
- The RPO is the last successful backup in the affected region.
- A production design would add cross-region replication or AWS Backup and a
  documented failover region. Both are optional extensions and are not
  implemented here.

## Restore procedure in detail

```bash
# 1. Confirm the environment and bucket.
export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
node scripts/verify.mjs

# 2. Find the exact version to recover.
node scripts/restore.mjs --list --key latest/service-config.yaml

# 3. Restore and verify the checksum.
node scripts/restore.mjs --key latest/service-config.yaml \
  --version-id <version-id> --out restored/service-config.yaml

# 4. Compare the printed hashes with the manifest.
node -e "const m=require('./manifests/manifest.json');const r=m.recoveries.at(-1);console.log(r.status, r.expectedSha256, r.actualSha256)"

# 5. Update the status report.
node scripts/report.mjs --live
```

The restore script writes the file even when the checksum fails, so the
operator can inspect the bytes. A failed restore exits 1 and must not be
treated as recovered data.

## Rebuilding the demo after loss

If Terraform state and the manifest survive but the bucket does not:

```bash
terraform -chdir=infra apply -auto-approve
export BUCKET_NAME="$(terraform -chdir=infra output -raw bucket_name)"
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

The old manifest points at version IDs in the old bucket and cannot verify
against the new bucket. Keep it as incident evidence and start a new manifest,
or restore the source files first and treat the new run as the new baseline.
Record the bucket name and run ID in the incident notes.

## Residual risks

| Risk | Impact | Current control | Residual exposure / next step |
| --- | --- | --- | --- |
| All object versions deleted | Total loss of backup history | Backup role has no delete permissions | An administrator, compromised operator or `force_destroy` can still delete everything. Use Object Lock or a separate immutable account for production. |
| Compromised credentials | Unauthorized reads, writes or deletes | Least-privilege role, private bucket, TLS-only policy | Operator/admin credentials may be broader than the role. Enable MFA, rotate keys, monitor CloudTrail. |
| Regional failure | Bucket unavailable | None in the core | Add cross-region replication or AWS Backup; test failover. |
| Lifecycle expiry after 7 days | Cannot restore older noncurrent versions | Configured retention is explicit | Increase `noncurrent_version_retention_days` to match the business window; document the change. |
| Local manifest loss | Checksums, keys and version IDs lost | Manifest kept with the project evidence | Store the manifest/report in a separate S3 prefix or durable system. Objects without a manifest are hard to verify. |
| Ransomware or malicious insider | Versions and delete markers removed | Versioning and restricted role | No Object Lock/WORM and no separate account. Add both for production. |
| Accidental `terraform destroy` | Bucket and all versions removed | Demo uses `force_destroy = true` intentionally | Demo-only setting. Real buckets need `false`, deletion protection and approvals. |
| Source data changed during a run | Mixed versions in one run | Files are read one at a time and hashed before upload | Take a consistent snapshot or quiesce writers for production. |
| Missed schedule | No backup, no failure event | Manual run, report and `check-freshness.mjs` | Invoke the check from a scheduler. Add an external dead-man's-switch if the scheduler itself can fail silently. |
| LocalStack fidelity | Local tests pass but AWS behavior differs | Real-AWS checklist and explicit limitations | Run the final evidence in real AWS; do not claim email or IAM enforcement from LocalStack. |
| SSE-S3 only | Account-level readers can decrypt | Bucket policy, IAM, encryption at rest | A customer-managed KMS key with tighter key policy is a production option; deliberately not used to stay under budget. |
| No MFA delete | A compromised root/admin can delete versions | IAM scope and approvals | Enable MFA delete or Object Lock for high-value buckets. |

## Test and review cadence

- After every backup: run `verify.mjs` and regenerate the report.
- Weekly during the project: restore one older run and compare the checksum.
- Before the final submission: complete every item in `docs/evidence.md`.
- After any policy or Terraform change: repeat the restore test and update the
  RTO/RPO if the change affects recovery.
- After the hackathon: destroy the demo stack and remove the LocalStack
  container. The evidence is the report, manifest and captured logs, not the
  live bucket.
