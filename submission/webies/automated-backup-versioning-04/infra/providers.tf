provider "aws" {
  region = var.aws_region

  # LocalStack accepts any non-empty access key. Export the conventional
  # test credentials in the shell (AWS_ACCESS_KEY_ID=test,
  # AWS_SECRET_ACCESS_KEY=test); no credentials are stored in this file.
  # On real AWS, leave use_localstack=false and use the normal AWS credential
  # chain (profile, SSO, or an attached instance/task role).
  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_region_validation      = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  s3_use_path_style           = var.use_localstack

  # A single boolean switches the provider between LocalStack and real AWS.
  # Null endpoint values tell the provider to use the standard AWS endpoints.
  endpoints {
    s3         = var.use_localstack ? var.localstack_endpoint : null
    sns        = var.use_localstack ? var.localstack_endpoint : null
    sqs        = var.use_localstack ? var.localstack_endpoint : null
    iam        = var.use_localstack ? var.localstack_endpoint : null
    sts        = var.use_localstack ? var.localstack_endpoint : null
    cloudwatch = var.use_localstack ? var.localstack_endpoint : null
  }
}
