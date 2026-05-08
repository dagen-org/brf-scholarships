import boto3
from functools import lru_cache
from mypy_boto3_dynamodb.service_resource import Table

from app.core.config import settings


@lru_cache(maxsize=1)
def get_table() -> Table:
    kwargs: dict = {"region_name": settings.aws_region}
    if settings.dynamodb_endpoint_url:
        kwargs["endpoint_url"] = settings.dynamodb_endpoint_url
        kwargs["aws_access_key_id"] = "local"
        kwargs["aws_secret_access_key"] = "local"

    dynamodb = boto3.resource("dynamodb", **kwargs)
    return dynamodb.Table(settings.dynamodb_table_name)
