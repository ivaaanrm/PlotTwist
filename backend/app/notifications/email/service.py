import logging
from pathlib import Path
from typing import Any

import emails  # type: ignore
from jinja2 import Template

from app.notifications.email.config import email_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "templates" / "build"


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (TEMPLATES_DIR / template_name).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert email_settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(email_settings.EMAILS_FROM_NAME, email_settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": email_settings.SMTP_HOST, "port": email_settings.SMTP_PORT}
    if email_settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif email_settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if email_settings.SMTP_USER:
        smtp_options["user"] = email_settings.SMTP_USER
    if email_settings.SMTP_PASSWORD:
        smtp_options["password"] = email_settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")
