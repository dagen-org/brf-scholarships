import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def _send(to: str, subject: str, body: str) -> None:
    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.sendmail(settings.smtp_from, [to], msg.as_string())


def send_verification_email(to: str, code: str) -> None:
    _send(
        to,
        "BRF Scholarships — Verify your email",
        f"<p>Your verification code is: <strong>{code}</strong></p>"
        "<p>Enter this code on the verification page to activate your account.</p>",
    )


def send_password_reset_email(to: str, code: str) -> None:
    _send(
        to,
        "BRF Scholarships — Password reset",
        f"<p>Your password reset code is: <strong>{code}</strong></p>"
        "<p>This code expires in 15 minutes. If you did not request this, ignore this email.</p>",
    )


def send_reviewer_invite_email(to: str, token: str) -> None:
    frontend_url = "http://localhost:5173"
    invite_link = f"{frontend_url}/accept-invite?token={token}"
    _send(
        to,
        "BRF Scholarships — You've been invited as a reviewer",
        f"<p>You have been invited to review scholarship applications for the Beaverton Rotary Foundation.</p>"
        f'<p><a href="{invite_link}">Click here to set your password and activate your account</a></p>'
        "<p>This link is valid for 7 days.</p>",
    )
