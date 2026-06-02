"""Optional email/SMS notifications (SMTP + log-only SMS stub)."""
from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
    return bool(os.environ.get("MEDSCAN_SMTP_HOST") and os.environ.get("MEDSCAN_SMTP_FROM"))


def send_email(to: str, subject: str, body: str) -> bool:
    host = os.environ.get("MEDSCAN_SMTP_HOST", "").strip()
    from_addr = os.environ.get("MEDSCAN_SMTP_FROM", "").strip()
    if not host or not from_addr or not to:
        return False
    port = int(os.environ.get("MEDSCAN_SMTP_PORT", "587"))
    user = os.environ.get("MEDSCAN_SMTP_USER", "").strip()
    password = os.environ.get("MEDSCAN_SMTP_PASSWORD", "")
    use_tls = os.environ.get("MEDSCAN_SMTP_TLS", "1").lower() in ("1", "true", "yes")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to
    msg.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            if use_tls:
                smtp.starttls()
            if user and password:
                smtp.login(user, password)
            smtp.send_message(msg)
        return True
    except Exception as exc:
        logger.warning("send_email failed to %s: %s", to, exc)
        return False


def send_sms(to: str, body: str) -> bool:
    """Log-only unless MEDSCAN_SMS_WEBHOOK_URL is set (POST json {to, body})."""
    webhook = os.environ.get("MEDSCAN_SMS_WEBHOOK_URL", "").strip()
    if webhook:
        try:
            import requests

            requests.post(webhook, json={"to": to, "body": body}, timeout=15).raise_for_status()
            return True
        except Exception as exc:
            logger.warning("send_sms webhook failed: %s", exc)
            return False
    logger.info("SMS (log-only) to %s: %s", to, body[:120])
    return True


def notify_reminder_due(email: str, phone: str, medicine_name: str, dose: str | None) -> None:
    subject = f"MedScan reminder: {medicine_name}"
    body = f"Time to take {medicine_name}" + (f" ({dose})" if dose else "") + "."
    if email:
        send_email(email, subject, body)
    if phone:
        send_sms(phone, body)
