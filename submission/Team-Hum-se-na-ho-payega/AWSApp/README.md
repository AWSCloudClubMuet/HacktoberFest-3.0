# Backup Vault

A small console for the AWS backup / versioning / disaster-recovery exercise.

## Run it

    python3 app.py

Open http://localhost:8000. That's it: no installs, no AWS account needed.
Without AWS settings, a local folder (`data/vault`) stands in for a versioned S3 bucket.

## Use a real bucket

    pip install boto3
    aws configure                      # or any normal credential setup, nothing is hardcoded
    export BACKUP_BUCKET=my-unique-backup-bucket
    export SNS_TOPIC_ARN=arn:aws:sns:...   # optional, sends alerts on failures
    python3 app.py

"Set up storage" then creates the bucket, blocks public access, turns on
versioning and encryption, and adds the lifecycle rule from your policy.
Needed IAM permissions: s3:CreateBucket, PutBucket*, PutObject, GetObject,
GetObjectVersion, ListBucket, ListBucketVersions, DeleteObject (and sns:Publish if used).

## Demo order

1. Set up storage, then Back up now.
2. Edit a source file, back up again, and open its version history.
3. Verify (a changed-but-not-backed-up file shows as stale).
4. Simulate a delete or bad update, then restore an earlier version.
5. Run a failing backup to see the alert and the "missed backup" warning.

## Files

- `app.py` - backend, storage backends, backup/verify/restore logic
- `static/` - the front end
- `data/` - created on first run (sample files, state, local vault)
