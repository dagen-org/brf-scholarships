# BRF Scholarships — Claude Instructions

## Git workflow
- **Never run `git push` automatically.** Commit changes locally and stop. The user validates locally and controls when to push.
- Run `npm run build` (frontend) before committing to catch TypeScript errors early.
- Stage specific files by name rather than `git add -A`.

## Local development
Start the stack:
```
make up       # start Docker services (DynamoDB Local, MinIO, MailHog)
make setup    # create DynamoDB table + S3 bucket (first time only)
make dev-backend   # uvicorn on :8080
make dev-frontend  # Vite on :5173, proxies /api → :8080
```
Bootstrap admin account at `http://localhost:5173/setup`.

Mail is captured by MailHog at `http://localhost:8025`.

## Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI (Python 3.12) + Mangum (Lambda adapter)
- **Database:** DynamoDB single-table (`brf-scholarships`) with GSI1 (role/type) and GSI2 (window) indexes
- **File storage:** S3 (MinIO locally); presigned PUT URLs for direct browser uploads
- **Auth:** Custom JWT in `Authorization` header; roles are `applicant`, `reviewer`, `admin`
- **Infrastructure:** Terraform → AWS Lambda + API Gateway v2 + S3 + CloudFront + SES
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`) — backend lint, frontend build, deploy on push to `main`

## Code style
- No comments unless the *why* is non-obvious (hidden constraint, workaround, subtle invariant).
- No docstrings or multi-line comment blocks.
- Python: formatted and linted with `ruff`. Run `make lint` before committing.
- TypeScript: ESLint via `npm run lint`. Build (`npm run build`) catches type errors.
- Don't add error handling for scenarios that can't happen; trust framework guarantees.
- Don't introduce abstractions beyond what the task requires.

## Architecture notes
- The backend runs identically under `uvicorn` (local) and AWS Lambda (prod) via the Mangum adapter.
- DynamoDB items include a full `data` blob for application form fields; list endpoints return the complete item including `data`.
- File uploads go directly from the browser to S3 via presigned URLs; the backend only stores `{file_id, filename}` references in the application `data` blob.
- Testing-type application windows allow admins and reviewers to create multiple test applications with no single-active restriction.
- SES is used for email in production (`USE_SES=true`); MailHog (SMTP on port 1025) is used locally.
