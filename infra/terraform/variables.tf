variable "aws_region" {
  description = "Primary AWS region for backend resources"
  type        = string
  default     = "us-west-2"
}

variable "app_name" {
  description = "Application name used as a prefix for resource names"
  type        = string
  default     = "brf-scholarships"
}

variable "environment" {
  description = "Deployment environment (prod, staging, etc.)"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Public domain name, e.g. scholarships.beavertonrotary.org"
  type        = string
}

variable "ses_from_email" {
  description = "Verified SES sender address, e.g. noreply@beavertonrotary.org"
  type        = string
}

variable "jwt_secret_key" {
  description = "Secret key for JWT signing — use a long random string"
  type        = string
  sensitive   = true
}

variable "lambda_package_path" {
  description = "Path to the built Lambda zip file (relative to infra/terraform/)"
  type        = string
  default     = "../dist/lambda.zip"
}
