# Automated Backup Status Report

> **Synthetic demo data.** This report was rendered from a sample manifest to validate report output. It is not evidence of a live AWS run.

Generated: 2026-10-21T06:24:45.197Z  
Manifest: `manifests/sample-manifest.json`  
Report: `reports/backup-status.sample.md`  
Environment: `synthetic`  
Bucket: `webies-backup-04-example`  
Region: `us-east-1`

## Summary

| Metric | Value |
| --- | --- |
| Total backup jobs | 2 |
| Successful backup jobs | 1 |
| Failed backup jobs | 1 |
| Total file uploads attempted | 10 |
| Successful file uploads | 9 |
| Failed file uploads | 1 |
| Last successful backup time | 2026-10-20T02:00:04.000Z |
| Last backup attempt | 2026-10-20T02:05:00.000Z (FAILED) |
| Verification status | PASS at 2026-10-20T02:02:00.000Z (5/5 files) |
| Recovered file status | PASS at 2026-10-20T02:04:00.000Z (service-config.yaml) |
| Archive storage (manifest) | 5.04 KiB across 9 file copies |
| Uploaded storage incl. latest mirror | 10.1 KiB |
| Retention | Noncurrent versions expire after 7 days |

## Backup runs

| Run ID | Started | Finished | Status | Files ok | Files failed | Archive bytes | Environment |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `20261020T020500000Z-e5f6a7b8` | 2026-10-20T02:05:00.000Z | 2026-10-20T02:05:04.000Z | FAILED | 4 | 1 | 2.48 KiB | synthetic |
| `20261020T020000000Z-a1b2c3d4` | 2026-10-20T02:00:00.000Z | 2026-10-20T02:00:04.000Z | SUCCESS | 5 | 0 | 2.56 KiB | synthetic |

## Verification status

| Verified at | Run ID | Status | Files checked | Files passed | Objects checked | Objects passed |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2026-10-20T02:02:00.000Z | `20261020T020000000Z-a1b2c3d4` | PASS | 5 | 5 | 10 | 10 |

## Recovery status

| Restored at | Key | Version ID | Status | Output | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| 2026-10-20T02:04:00.000Z | `latest/service-config.yaml` | `synth-v1-latest-config` | PASS | `restored/service-config.yaml` | `f437f6a38da6...` |

Latest recovery: **PASS** for `service-config.yaml` (run `20261020T020000000Z-a1b2c3d4`).

Expected SHA-256: `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`  
Actual SHA-256:   `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`

## Storage and retention

- Manifest archive copies: 9 objects, 5.04 KiB.
- Uploaded bytes including the overwritten `latest/` mirror: 10.1 KiB. The mirror keeps one object per source file but retains every historical version.
- Distinct `latest/` keys: 5.
- Live S3 totals were not queried. Run with `--live` to include real current/noncurrent version counts; billed storage can exceed the manifest estimate because every version is retained.
- Lifecycle rule `expire-noncurrent-versions` expires noncurrent versions after 7 days and aborts incomplete multipart uploads after 1 day.
- Current versions are retained until explicitly deleted; versioning does not impose a retention limit by itself.
- The demo bucket uses `force_destroy = true` so `terraform destroy` can remove all versions. Real data buckets should set it to `false`.

## Failure events

| Time | Type | Detail |
| --- | --- | --- |
| 2026-10-20T02:05:04.000Z | backup | 20261020T020500000Z-e5f6a7b8/archive/2026-Q3-summary.csv: simulated upload failed: Simulated upload failure requested by --simulate-failure. |

## Reproduce

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

The manifest is the source of truth for expected keys, sizes, checksums and version IDs. Verification downloads each recorded version; it does not trust S3 metadata alone.

