###############################################################################
# S3 backup bucket
###############################################################################

resource "aws_s3_bucket" "backup" {
  bucket_prefix = var.bucket_prefix
  force_destroy = var.force_destroy

  tags = merge(var.tags, {
    Name = "${var.project_name}-backup"
  })
}

resource "aws_s3_bucket_public_access_block" "backup" {
  bucket = aws_s3_bucket.backup.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "backup" {
  bucket = aws_s3_bucket.backup.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id

  rule {
    id     = "expire-noncurrent-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_retention_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  depends_on = [aws_s3_bucket_versioning.backup]
}

data "aws_iam_policy_document" "bucket_tls_only" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.backup.arn,
      "${aws_s3_bucket.backup.arn}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "backup" {
  bucket = aws_s3_bucket.backup.id
  policy = data.aws_iam_policy_document.bucket_tls_only.json

  depends_on = [aws_s3_bucket_public_access_block.backup]
}

###############################################################################
# Alerting path: SNS topic -> SQS subscriber (and optional email)
###############################################################################

resource "aws_sns_topic" "backup_alerts" {
  name_prefix = "${var.project_name}-alerts-"
  tags        = merge(var.tags, { Name = "${var.project_name}-alerts" })
}

resource "aws_sqs_queue" "backup_alerts" {
  name_prefix                = "${var.project_name}-alerts-"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 30
  sqs_managed_sse_enabled    = true
  tags                       = merge(var.tags, { Name = "${var.project_name}-alerts" })
}

data "aws_iam_policy_document" "sqs_allow_sns" {
  statement {
    sid    = "AllowSnsTopicToSendMessages"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.backup_alerts.arn]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.backup_alerts.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "backup_alerts" {
  queue_url = aws_sqs_queue.backup_alerts.id
  policy    = data.aws_iam_policy_document.sqs_allow_sns.json
}

resource "aws_sns_topic_subscription" "sqs" {
  topic_arn            = aws_sns_topic.backup_alerts.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.backup_alerts.arn
  raw_message_delivery = true

  depends_on = [aws_sqs_queue_policy.backup_alerts]
}

resource "aws_sns_topic_subscription" "email" {
  count = var.alert_email == "" ? 0 : 1

  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

###############################################################################
# Least-privilege role for the backup process
###############################################################################

data "aws_iam_policy_document" "backup_assume_role" {
  statement {
    sid     = "AllowBackupServiceToAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = [var.backup_job_principal]
    }
  }
}

resource "aws_iam_role" "backup" {
  name_prefix        = "${var.project_name}-"
  description        = "Least-privilege role for the automated S3 backup and restore process."
  assume_role_policy = data.aws_iam_policy_document.backup_assume_role.json

  tags = merge(var.tags, { Name = "${var.project_name}-backup-role" })
}

data "aws_iam_policy_document" "backup" {
  statement {
    sid = "ListBucketAndVersions"
    actions = [
      "s3:ListBucket",
      "s3:ListBucketVersions",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.backup.arn]
  }

  statement {
    sid = "ReadWriteBackupAndReportObjects"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
    ]
    # PutObject also covers the optional reports/ prefix if a team later
    # chooses to publish backup reports into the same bucket.
    resources = ["${aws_s3_bucket.backup.arn}/*"]
  }

  statement {
    sid       = "PublishFailureAlerts"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.backup_alerts.arn]
  }
}

resource "aws_iam_policy" "backup" {
  name_prefix = "${var.project_name}-"
  description = "List, read, write and restore S3 backups; publish failure alerts."
  policy      = data.aws_iam_policy_document.backup.json

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = aws_iam_policy.backup.arn
}
