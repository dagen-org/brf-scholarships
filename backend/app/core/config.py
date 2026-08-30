from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Security
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 240

    # DynamoDB
    aws_region: str = "us-west-2"
    dynamodb_endpoint_url: str | None = None
    dynamodb_table_name: str = "brf-scholarships"

    # S3 / MinIO
    s3_endpoint_url: str | None = None
    s3_bucket_name: str = "brf-uploads"
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin"

    # Email
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_from: str = "noreply@brf-scholarships.org"
    use_ses: bool = False
    frontend_url: str = "http://localhost:5173"

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            import json

            return json.loads(v)
        return v

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
