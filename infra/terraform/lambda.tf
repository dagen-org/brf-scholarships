resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.app_name}"
  retention_in_days = 30
}

resource "aws_lambda_function" "api" {
  function_name    = var.app_name
  filename         = var.lambda_package_path
  source_code_hash = filebase64sha256(var.lambda_package_path)
  role             = aws_iam_role.lambda_exec.arn
  handler          = "app.main.handler"
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SECRET_KEY          = var.jwt_secret_key
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main.name
      S3_BUCKET_NAME      = aws_s3_bucket.uploads.id
      SMTP_FROM           = var.ses_from_email
      USE_SES             = "true"
      FRONTEND_URL        = "https://${var.domain_name}"
      CORS_ORIGINS        = jsonencode(["https://${var.domain_name}"])
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]
}

# ── API Gateway HTTP API v2 ───────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "lambda" {
  name          = var.app_name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.lambda.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "catch_all" {
  api_id    = aws_apigatewayv2_api.lambda.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "lambda" {
  api_id      = aws_apigatewayv2_api.lambda.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      caller          = "$context.identity.caller"
      user            = "$context.identity.user"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      routeKey        = "$context.routeKey"
      status          = "$context.status"
      protocol        = "$context.protocol"
      responseLength  = "$context.responseLength"
    })
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda.execution_arn}/*/*"
}
