provider "aws" {
  region = var.aws_region

  # Use the standard AWS credential chain: profile, SSO, environment
  # variables, or an attached instance/task role. No credentials are stored
  # in this repository.
}
