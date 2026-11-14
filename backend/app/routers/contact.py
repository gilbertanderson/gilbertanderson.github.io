"""Contact form endpoint: saves each message to the database and, if SMTP is
configured, emails it on."""

import logging
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from ..database import get_session
from ..models import ContactSubmission
from ..schemas import ContactMessage, ContactReceipt
from ..settings import settings

log = logging.getLogger(__name__)
router = APIRouter(tags=["contact"])


def forward_by_email(msg: ContactMessage) -> None:
    if not (settings.smtp_host and settings.contact_to):
        return
    email = EmailMessage()
    email["Subject"] = f"Site contact from {msg.name}"
    email["From"] = settings.smtp_from or settings.contact_to
    email["To"] = settings.contact_to
    email["Reply-To"] = msg.email
    email.set_content(msg.message)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.starttls()
        if settings.smtp_user:
            smtp.login(settings.smtp_user, settings.smtp_password or "")
        smtp.send_message(email)


@router.post("/contact", response_model=ContactReceipt, operation_id="sendContact")
def send_contact(msg: ContactMessage, session: Session = Depends(get_session)) -> ContactReceipt:
    try:
        session.add(ContactSubmission(**msg.model_dump()))
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        log.exception("could not save contact message")
        raise HTTPException(status_code=503, detail="Could not deliver the message right now.") from exc

    try:
        forward_by_email(msg)
    except (OSError, smtplib.SMTPException):
        # The message is safely stored; a mail outage shouldn't fail the request.
        log.exception("saved contact message but could not email it")

    return ContactReceipt(ok=True, detail="Thanks — message sent.")
