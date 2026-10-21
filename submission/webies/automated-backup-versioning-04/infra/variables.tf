variable "aws_region" {
  description = "AWS region used by the provider and the backup scripts."
  type        = string
  default     = "us-east-1"
}

variable "use_localstack" {
  description = "Send provider traffic to LocalStack instead of real AWS."
  type        = bool
  default     = true
}

variable "localstack_endpoint" {
  description = "LocalStack edge endpoint for S3, SNS, SQS, IAM, STS and CloudWatch."
  type        = string
  default     = "http://localhost:4566"

  validation {
    condition     = can(regex("^https?://[^/]+", var.localstack_endpoint))
    error_message = "localstack_endpoint must start with http:// or https://."
  }
}

variable "project_name" {
  description = "Prefix used for named AWS resources."
  type        = string
  default     = "webies-backup-04"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{2,29}$", var.project_name))
    error_message = "project_name must be 3-30 lowercase letters, digits or hyphens."
  }
}

variable "bucket_prefix" {
  description = "S3 bucket prefix. AWS appends a unique suffix to keep names globally unique."
  type        = string
  default     = "webies-backup-04-"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,35}$", var.bucket_prefix))
    error_message = "bucket_prefix must be 2-37 lowercase letters, digits or hyphens."
  }
}

variable "force_destroy" {
  description = "Allow terraform destroy to delete all object versions. Demo-only convenience."
  type        = bool
  default     = true
}

variable "noncurrent_version_retention_days" {
  description = "Days to retain noncurrent S3 object versions before lifecycle expiry."
  type        = number
  default     = 7

  validation {
    condition     = var.noncurrent_version_retention_days >= 7 && var.noncurrent_version_retention_days <= 30
    error_message = "Use a retention period between 7 and 30 days."
  }
}

variable "alert_email" {
  description = "Optional email address subscribed to the alert SNS topic (real AWS only)."
  type        = string
  default     = ""

  validation {
    condition     = var.alert_email == "" || can(regex("^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$", var.alert_email))
    error_message = "alert_email must be empty or look like name@example.com."
  }
}

variable "enable_cloudwatch_alarm" {
  description = "Create the optional CloudWatch alarm on the custom BackupFailures metric."
  type        = bool
  default     = false
}

variable "cloudwatch_metric_namespace" {
  description = "Namespace used by backup.mjs for the optional failure metric."
  type        = string
  default     = "WebiesBackup"

  validation {
    condition     = can(regex("^[A-Za-z0-9._-]{1,255}$", var.cloudwatch_metric_namespace))
    error_message = "cloudwatch_metric_namespace contains invalid characters."
  }
}

variable "backup_job_principal" {
  description = "AWS service principal allowed to assume the backup job role."
  type        = string
  default     = "lambda.amazonaws.com"

  validation {
    condition     = can(regex("^[a-z0-9-]+[.]amazonaws[.]com$", var.backup_job_principal))
    error_message = "backup_job_principal must be an AWS service principal such as lambda.amazonaws.com."
  }
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default = {
    Project     = "webies-automated-backup"
    Environment = "demo"
    ManagedBy   = "terraform"
  }
}
