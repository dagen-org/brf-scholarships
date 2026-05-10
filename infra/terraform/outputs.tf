output "site_url" {
  description = "Public URL of the application"
  value       = "https://${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation on frontend deploys"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain" {
  description = "Add a CNAME record in your DNS: scholarships → this value"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "frontend_bucket" {
  description = "S3 bucket name for the React frontend"
  value       = aws_s3_bucket.frontend.id
}

output "uploads_bucket" {
  description = "S3 bucket name for applicant file uploads"
  value       = aws_s3_bucket.uploads.id
}

output "dynamodb_table" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "api_gateway_url" {
  description = "Direct API Gateway invoke URL (normally accessed via CloudFront at /api/*)"
  value       = aws_apigatewayv2_stage.lambda.invoke_url
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

# ── Manual DNS records ────────────────────────────────────────────────────────

output "acm_validation_cname" {
  description = "Add this CNAME in your DNS provider to issue the TLS certificate"
  value = [for dvo in aws_acm_certificate.frontend.domain_validation_options : {
    name  = dvo.resource_record_name
    type  = dvo.resource_record_type
    value = dvo.resource_record_value
  }]
}

output "ses_verification_txt" {
  description = "Add this TXT record to verify your SES sending domain"
  value = {
    name  = "_amazonses.${local.ses_domain}"
    type  = "TXT"
    value = aws_ses_domain_identity.main.verification_token
  }
}

output "ses_dkim_cnames" {
  description = "Add these 3 CNAME records to enable DKIM signing for SES"
  value = [for token in aws_ses_domain_dkim.main.dkim_tokens : {
    name  = "${token}._domainkey.${local.ses_domain}"
    type  = "CNAME"
    value = "${token}.dkim.amazonses.com"
  }]
}
