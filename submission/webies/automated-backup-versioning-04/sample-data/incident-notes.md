# Incident notes

## 2026-10-19 - Incorrect config rollout

A deployment changed `features.maintenanceBanner` to `true` in production.
The previous value was restored from the versioned backup object.

## Recovery evidence to capture

- The object key and version ID used for the restore.
- The SHA-256 recorded in the backup manifest.
- The SHA-256 of the restored file, which must match.
- A `terraform destroy` log showing the demo resources were removed.

## Facts

- Backup owner: Webies team.
- Sample data is synthetic and contains no personal data.
- The demo bucket is deleted at the end of the exercise.
