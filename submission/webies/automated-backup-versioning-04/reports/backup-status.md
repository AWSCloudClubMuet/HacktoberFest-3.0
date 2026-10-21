# Automated Backup Status Report

Generated: 2026-10-21T06:31:56.111Z  
Manifest: `manifests/manifest.json`  
Report: `reports/backup-status.md`  
Environment: `localstack:http://localhost:4566`  
Bucket: `webies-backup-04-20261021063010751100000006`  
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
| Last successful backup time | 2026-10-21T06:31:55.546Z |
| Last backup attempt | 2026-10-21T06:31:55.430Z (SUCCESS) |
| Verification status | PASS at 2026-10-21T06:31:55.871Z (5/5 files) |
| Recovered file status | PASS at 2026-10-21T06:31:16.056Z (service-config.yaml) |
| Archive storage (manifest) | 10.2 KiB across 19 file copies |
| Uploaded storage incl. latest mirror | 20.3 KiB |
| Retention | Noncurrent versions expire after 7 days |

## Backup runs

| Run ID | Started | Finished | Status | Files ok | Files failed | Archive bytes | Environment |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `20261021T063155430Z-99a92f2e` | 2026-10-21T06:31:55.430Z | 2026-10-21T06:31:55.546Z | SUCCESS | 5 | 0 | 2.56 KiB | localstack:http://localhost:4566 |
| `20261021T063127373Z-58d72dd2` | 2026-10-21T06:31:27.373Z | 2026-10-21T06:31:27.478Z | FAILED | 4 | 1 | 2.44 KiB | localstack:http://localhost:4566 |
| `20261021T063115433Z-5a45dd85` | 2026-10-21T06:31:15.433Z | 2026-10-21T06:31:15.548Z | SUCCESS | 5 | 0 | 2.60 KiB | localstack:http://localhost:4566 |
| `20261021T063115125Z-aa8c428b` | 2026-10-21T06:31:15.125Z | 2026-10-21T06:31:15.236Z | SUCCESS | 5 | 0 | 2.56 KiB | localstack:http://localhost:4566 |

## Verification status

| Verified at | Run ID | Status | Files checked | Files passed | Objects checked | Objects passed |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2026-10-21T06:31:55.871Z | `20261021T063155430Z-99a92f2e` | PASS | 5 | 5 | 10 | 10 |
| 2026-10-21T06:31:28.058Z | `20261021T063127373Z-58d72dd2` | FAIL | 5 | 4 | 10 | 8 |
| 2026-10-21T06:31:16.349Z | `20261021T063115433Z-5a45dd85` | PASS | 5 | 5 | 10 | 10 |

## Recovery status

| Restored at | Key | Version ID | Status | Output | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| 2026-10-21T06:31:16.056Z | `latest/service-config.yaml` | `AaFdIH978Lkv.1UFdJ9JKL1G0d56vvn_` | PASS | `restored/service-config-v1.yaml` | `f437f6a38da6...` |

Latest recovery: **PASS** for `service-config.yaml` (run `20261021T063115125Z-aa8c428b`).

Expected SHA-256: `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`  
Actual SHA-256:   `f437f6a38da6aa4d0b15c4242e587fd39bd9fd5a06310816af39d148841e5871`

## Storage and retention

- Manifest archive copies: 19 objects, 10.2 KiB.
- Uploaded bytes including the overwritten `latest/` mirror: 20.3 KiB. The mirror keeps one object per source file but retains every historical version.
- Distinct `latest/` keys: 5.
- Live S3 totals: 24 current version(s) / 12.7 KiB; 14 noncurrent version(s) / 7.60 KiB; 0 delete marker(s).
- Live S3 bytes across all versions: 20.3 KiB.
- Lifecycle rule `expire-noncurrent-versions` expires noncurrent versions after 7 days and aborts incomplete multipart uploads after 1 day.
- Current versions are retained until explicitly deleted; versioning does not impose a retention limit by itself.
- The demo bucket uses `force_destroy = true` so `terraform destroy` can remove all versions. Real data buckets should set it to `false`.

## Failure events

| Time | Type | Detail |
| --- | --- | --- |
| 2026-10-21T06:31:28.058Z | verify | 20261021T063127373Z-58d72dd2: 1/5 files failed |
| 2026-10-21T06:31:27.478Z | backup | 20261021T063127373Z-58d72dd2/archive/2026-Q3-summary.csv: simulated upload failed: Error: Simulated upload failure requested by --simulate-failure. |

## Reproduce

```bash
node scripts/backup.mjs
node scripts/verify.mjs
node scripts/report.mjs --live
```

The manifest is the source of truth for expected keys, sizes, checksums and version IDs. Verification downloads each recorded version; it does not trust S3 metadata alone.

