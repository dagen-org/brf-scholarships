# Deployment Guide

## Prerequisites

- AWS CLI configured with credentials that have sufficient permissions
- Terraform >= 1.6 installed
- Python 3.12 and `pip` available on your PATH
- A Route53 hosted zone for your domain

## First-time setup

### 1. Create the Terraform state bucket

Terraform state is stored in S3. This bucket must exist before running `terraform init`.
Create it once manually (substitute your preferred bucket name and region):

```bash
aws s3api create-bucket \
  --bucket brf-scholarships-tfstate \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws s3api put-bucket-versioning \
  --bucket brf-scholarships-tfstate \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket brf-scholarships-tfstate \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### 2. Configure Terraform variables

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit `terraform.tfvars` and fill in all values:

```hcl
aws_region       = "us-west-2"
app_name         = "brf-scholarships"
environment      = "prod"
domain_name      = "scholarships.beavertonrotary.org"
hosted_zone_name = "beavertonrotary.org"
ses_from_email   = "noreply@beavertonrotary.org"
jwt_secret_key   = "REPLACE_WITH_LONG_RANDOM_SECRET"
```

Generate a strong `jwt_secret_key`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Build the Lambda package

```bash
./scripts/build_lambda.sh
```

Output: `infra/dist/lambda.zip`

### 4. Provision AWS infrastructure

```bash
cd infra/terraform
terraform init \
  -backend-config="bucket=brf-scholarships-tfstate" \
  -backend-config="key=brf-scholarships/terraform.tfstate" \
  -backend-config="region=us-west-2"
terraform apply
```

ACM certificate validation and CloudFront distribution creation can take 10–15 minutes.

### 5. Build and deploy the frontend

```bash
cd frontend
npm install
npm run build
```

Then sync to S3 (substitute bucket name from Terraform output):

```bash
BUCKET=$(cd ../infra/terraform && terraform output -raw frontend_bucket)
aws s3 sync dist/ s3://$BUCKET/ --delete
```

### 6. Invalidate the CloudFront cache

```bash
DIST_ID=$(cd infra/terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Subsequent deploys

### Backend only

```bash
./scripts/build_lambda.sh
cd infra/terraform
terraform apply
```

### Frontend only

```bash
cd frontend && npm run build
BUCKET=$(cd ../infra/terraform && terraform output -raw frontend_bucket)
aws s3 sync dist/ s3://$BUCKET/ --delete
DIST_ID=$(cd ../infra/terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Useful outputs

After `terraform apply`, retrieve key values with:

```bash
terraform -chdir=infra/terraform output
```

| Output | Description |
|---|---|
| `site_url` | Public URL of the application |
| `cloudfront_distribution_id` | Needed for cache invalidation |
| `frontend_bucket` | S3 bucket for the React frontend |
| `uploads_bucket` | S3 bucket for applicant file uploads |
| `dynamodb_table` | DynamoDB table name |
| `lambda_function_name` | Lambda function name |

---

## GitHub Actions CI/CD

Pushing to `main` automatically lints, builds, and deploys via `.github/workflows/ci.yml`.
Pull requests run lint and build checks only — no deploy.

### One-time GitHub configuration

In your repository go to **Settings → Secrets and variables → Actions** and add:

**Secrets** (sensitive values, never shown in logs):

| Name | Example value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key for the deploy user |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key for the deploy user |
| `JWT_SECRET_KEY` | Output of `python3 -c "import secrets; print(secrets.token_hex(32))"` |

**Variables** (plain text, visible in logs):

| Name | Example value |
|---|---|
| `AWS_REGION` | `us-west-2` |
| `DOMAIN_NAME` | `scholarships.beavertonrotary.org` |
| `HOSTED_ZONE_NAME` | `beavertonrotary.org` |
| `SES_FROM_EMAIL` | `noreply@beavertonrotary.org` |
| `TF_STATE_BUCKET` | `brf-scholarships-tfstate` |

### IAM permissions for the deploy user

The `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` credentials need an IAM user (or role)
with permissions to manage all resources Terraform provisions: Lambda, API Gateway,
CloudFront, ACM, DynamoDB, S3, SES, IAM roles, Route53, and CloudWatch Logs.
For a private project, attaching the `AdministratorAccess` managed policy is the
simplest option. For tighter control, scope it to only the services listed above.

---

## Notes

- `terraform.tfvars` is gitignored — it contains the JWT secret, never commit it.
- `infra/dist/` is gitignored — the Lambda zip is built fresh on every deploy.
- SES starts in sandbox mode. [Request production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) before going live so email can be sent to unverified addresses.
- To tail Lambda logs: `aws logs tail /aws/lambda/brf-scholarships --follow`
