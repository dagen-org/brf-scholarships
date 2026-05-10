locals {
  ses_domain = split("@", var.ses_from_email)[1]
}

resource "aws_ses_domain_identity" "main" {
  domain = local.ses_domain
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}
