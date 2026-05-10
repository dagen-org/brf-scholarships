# Deployment Guide

## Prerequisites

- AWS CLI configured with credentials that have sufficient permissions
- Terraform >= 1.6 installed
- Python 3.12 and `pip` available on your PATH

## First-time setup

### 1. Create the Terraform state bucket

Terraform state is stored in S3. This bucket must exist before running `terraform init`.
Create it once manually:

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
aws_region     = "us-west-2"
app_name       = "brf-scholarships"
environment    = "prod"
domain_name    = "scholarships.beavertonrotary.org"
ses_from_email = "scholarship@beavertonrotary.org"
jwt_secret_key = "REPLACE_WITH_LONG_RANDOM_SECRET"
```

Generate a strong `jwt_secret_key`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Issue the TLS certificate (two-step to get DNS record values)

ACM requires a CNAME in your DNS to prove domain ownership before it will issue a certificate.
Because DNS is managed outside AWS, this is a two-step process.

**Step 3a** — create the certificate resource and get the validation record:

```bash
cd infra/terraform
terraform init \
  -backend-config="bucket=brf-scholarships-tfstate" \
  -backend-config="key=brf-scholarships/terraform.tfstate" \
  -backend-config="region=us-west-2"
terraform apply -target=aws_acm_certificate.frontend
terraform output acm_validation_cname
```

**Step 3b** — add the CNAME shown in the output to your DNS provider (WordPress dashboard),
then wait a few minutes for AWS to validate the certificate before continuing.

### 4. Build the Lambda package

```bash
./scripts/build_lambda.sh
```

Output: `infra/dist/lambda.zip`

### 5. Provision all AWS infrastructure

```bash
cd infra/terraform
terraform apply
```

This will wait for the ACM certificate to finish validating, then create CloudFront,
API Gateway, Lambda, DynamoDB, S3, and SES. CloudFront creation takes 5–10 minutes.

### 6. Add DNS records in your domain provider

After apply completes, retrieve the required DNS records:

```bash
terraform -chdir=infra/terraform output cloudfront_domain
terraform -chdir=infra/terraform output ses_verification_txt
terraform -chdir=infra/terraform output ses_dkim_cnames
```

Add these records in your WordPress / domain dashboard:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `scholarships` | CloudFront domain from output |
| `TXT` | `_amazonses.beavertonrotary.org` | SES verification token from output |
| `CNAME` | *(3 records from `ses_dkim_cnames`)* | As shown in output |
| `TXT` | `_dmarc.beavertonrotary.org` | `v=DMARC1; p=quarantine; rua=mailto:scholarship@beavertonrotary.org` |

The CNAME for `scholarships` is what makes `scholarships.beavertonrotary.org` resolve to
your CloudFront distribution. The SES records are needed for email deliverability.

### 7. Build and deploy the frontend

```bash
cd frontend
npm install
npm run build
BUCKET=$(cd ../infra/terraform && terraform output -raw frontend_bucket)
aws s3 sync dist/ s3://$BUCKET/ --delete
DIST_ID=$(cd ../infra/terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Subsequent deploys

### Backend only

```bash
./scripts/build_lambda.sh
terraform -chdir=infra/terraform apply
```

### Frontend only

```bash
cd frontend && npm run build
BUCKET=$(terraform -chdir=infra/terraform output -raw frontend_bucket)
aws s3 sync dist/ s3://$BUCKET/ --delete
DIST_ID=$(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

---

## Useful outputs

```bash
terraform -chdir=infra/terraform output
```

| Output | Description |
|---|---|
| `site_url` | Public URL of the application |
| `cloudfront_distribution_id` | Needed for cache invalidation |
| `cloudfront_domain` | CNAME target for your DNS provider |
| `frontend_bucket` | S3 bucket for the React frontend |
| `uploads_bucket` | S3 bucket for applicant file uploads |
| `dynamodb_table` | DynamoDB table name |
| `lambda_function_name` | Lambda function name |
| `acm_validation_cname` | CNAME needed to issue the TLS certificate |
| `ses_verification_txt` | TXT record for SES domain verification |
| `ses_dkim_cnames` | 3 CNAME records for SES DKIM signing |

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
| `SES_FROM_EMAIL` | `scholarship@beavertonrotary.org` |
| `TF_STATE_BUCKET` | `brf-scholarships-tfstate` |

### IAM permissions for the deploy user

The deploy credentials need permissions to manage: Lambda, API Gateway, CloudFront, ACM,
DynamoDB, S3, SES, IAM roles, and CloudWatch Logs. For a private project, attaching the
`AdministratorAccess` managed policy is the simplest option.

---

## Notes

- `terraform.tfvars` is gitignored — it contains the JWT secret, never commit it.
- `infra/dist/` is gitignored — the Lambda zip is built fresh on every deploy.
- SES starts in sandbox mode. [Request production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html) before going live so email can be sent to unverified addresses.
- To tail Lambda logs: `aws logs tail /aws/lambda/brf-scholarships --follow`
