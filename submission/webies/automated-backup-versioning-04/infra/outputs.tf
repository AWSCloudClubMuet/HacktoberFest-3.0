output "bucket_name" {
  description = "Name of the versioned backup bucket."
  value       = aws_s3_bucket.backup.bucket
}

output "bucket_arn" {
  description = "ARN of the backup bucket."
  value       = aws_s3_bucket.backup.arn
}

output "sns_topic_arn" {
  description = "SNS topic used for backup failure alerts."
  value       = aws_sns_topic.backup_alerts.arn
}

output "iam_role_arn" {
  description = "Least-privilege IAM role ARN for the backup process."
  value       = aws_iam_role.backup.arn
}

output "region" {
  description = "Region used by the deployment."
  value       = var.aws_region
}

output "sqs_queue_url" {
  description = "SQS queue URL that receives SNS failure alerts for local verification."
  value       = aws_sqs_queue.backup_alerts.id
}

output "sqs_queue_arn" {
  description = "ARN of the alert verification queue."
  value       = aws_sqs_queue.backup_alerts.arn
}

output "noncurrent_version_retention_days" {
  description = "Lifecycle retention used for noncurrent object versions."
  value       = var.noncurrent_version_retention_days
}

output "cloudwatch_metric_namespace" {
  description = "Namespace expected by the optional CloudWatch failure alarm."
  value       = var.cloudwatch_metric_namespace
}

output "cloudwatch_alarm_name" {
  description = "Name of the optional CloudWatch alarm, or null when it is disabled."
  value       = var.enable_cloudwatch_alarm ? aws_cloudwatch_metric_alarm.backup_failures[0].alarm_name : null
}

output "alert_email_subscription_arn" {
  description = "ARN of the optional email subscription, or null when no email is configured."
  value       = var.alert_email == "" ? null : aws_sns_topic_subscription.email[0].arn
}

output "localstack_endpoint" {
  description = "LocalStack endpoint in use, or null for real AWS."
  value       = var.use_localstack ? var.localstack_endpoint : null
}
