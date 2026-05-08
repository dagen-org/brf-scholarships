output "site_url" {
  description = "Public URL of the application"
  value       = "https://${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — needed for cache invalidation on frontend deploys"
  value       = aws_cloudfront_distribution.frontend.id
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
