# Automated Backup Status Report

Generated: 2026-10-21T09:07:18.030Z  
Manifest: `manifests/real-aws-manifest.json`  
Report: `reports/real-aws-backup-status.md`  
Environment: `aws`  
Bucket: `webies-backup-04-20261021090415438700000006`  
Region: `us-east-1`

## Summary

| Metric | Value |
| --- | --- |
| Total backup jobs | 4 |
| Successful backup jobs | 3 |
| Failed backup jobs | 1 |
| Total file uploads attempted | 20 |
| Successful file uploads | 19 |
| Failed file uploads | 1 |
| Last successful backup time | 2026-10-21T09:07:11.521Z |
| Last backup attempt | 2026-10-21T09:07:08.402Z (SUCCESS) |
| Verification status | PASS at 2026-10-21T09:07:14.770Z (5/5 files) |
| Recovered file status | PASS at 2026-10-21T09:06:41.894Z (service-config.yaml) |
| Archive storage (manifest) | 10.1 KiB across 19 file copies |
| Uploaded storage incl. latest mirror | 20.3 KiB |
| Retention | Noncurrent versions expire after 7 days |

## Backup runs

| Run ID | Started | Finished | Status | Files ok | Files failed | Archive bytes | Environment |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `20261021T090708402Z-003d551b` | 2026-10-21T09:07:08.402Z | 2026-10-21T09:07:11.521Z | SUCCESS | 5 | 0 | 2.56 KiB | aws |
| `20261021T090650777Z-e8a64ced` | 2026-10-21T09:06:50.777Z | 2026-10-21T09:06:53.107Z | FAILED | 4 | 1 | 2.44 KiB | aws |
| `20261021T090637281Z-109b299d` | 2026-10-21T09:06:37.281Z | 2026-10-21T09:06:40.121Z | SUCCESS | 5 | 0 | 2.56 KiB | aws |
| `20261021T090603327Z-9dc6f3af` | 2026-10-21T09:06:03.327Z | 2026-10-21T09:06:06.168Z | SUCCESS | 5 | 0 | 2.56 KiB | aws |

## Verification status

| Verified at | Run ID | Status | Files checked | Files passed | Objects checked | Objects passed |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2026-10-21T09:07:14.770Z | `20261021T090708402Z-003d551b` | PASS | 5 | 5 | 10 | 10 |
| 2026-10-21T09:06:57.501Z | `20261021T090650777Z-e8a64ced` | FAIL | 5 | 4 | 10 | 8 |
| 2026-10-21T09:06:09.341Z | `20261021T090603327Z-9dc6f3af` | PASS | 5 | 5 | 10 | 10 |

## Recovery status

| Restored at | Key | Version ID | Status | Output | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| 2026-10-21T09:06:41.894Z | `latest/service-config.yaml` | `ashBEwKTXum743ZlNGlQy1tjvG1raCVM` | PASS | `restored/real-aws-service-config.run1.yaml` | `f437f6a38da6...` |

Latest recovery: **PASS** for `service-config.yaml` (run `20261021T090603327Z-9dc6f3af`).

Expected SHA-256: `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`  
Actual SHA-256:   `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`

## Storage and retention

- Manifest archive copies: 19 objects, 10.1 KiB.
- Uploaded bytes including the overwritten `latest/` mirror: 20.3 KiB. The mirror keeps one object per source file but retains every historical version.
- Distinct `latest/` keys: 5.
- Live S3 totals: 24 current version(s) / 12.7 KiB; 14 noncurrent version(s) / 7.57 KiB; 0 delete marker(s).
- Live S3 bytes across all versions: 20.3 KiB.
- Lifecycle rule `expire-noncurrent-versions` expires noncurrent versions after 7 days and aborts incomplete multipart uploads after 1 day.
- Current versions are retained until explicitly deleted; versioning does not impose a retention limit by itself.
- The demo bucket uses `force_destroy = true` so `terraform destroy` can remove all versions. Real data buckets should set it to `false`.

## Failure events

| Time | Type | Detail |
| --- | --- | --- |
| 2026-10-21T09:06:57.501Z | verify | 20261021T090650777Z-e8a64ced: 1/5 files failed |
| 2026-10-21T09:06:53.107Z | backup | 20261021T090650777Z-e8a64ced/archive/2026-Q3-summary.csv: simulated upload failed: Error: Simulated upload failure requested by --simulate-failure. |

## Reproduce

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

The manifest is the source of truth for expected keys, sizes, checksums and version IDs. Verification downloads each recorded version; it does not trust S3 metadata alone.

