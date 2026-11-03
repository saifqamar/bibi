"""Email port and adapters."""

import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage as MimeMessage
from typing import Protocol

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmailMessage:
    to: str
    subject: str
    text: str
    html: str | None = None


class EmailPort(Protocol):
    def send(self, message: EmailMessage) -> None: ...


class ConsoleEmail:
    """Development adapter: writes emails to the log instead of sending them."""

    def send(self, message: EmailMessage) -> None:
        logger.info(
            "email", extra={"to": message.to, "subject": message.subject, "body": message.text}
        )


class FakeEmail:
    """Test adapter: keeps sent messages in ``outbox``."""

    def __init__(self) -> None:
        self.outbox: list[EmailMessage] = []

    def send(self, message: EmailMessage) -> None:
        self.outbox.append(message)


class SmtpEmail:
    def __init__(
        self,
        host: str,
        port: int,
        sender: str,
        username: str | None = None,
        password: str | None = None,
    ) -> None:
        self._host, self._port, self._sender = host, port, sender
        self._username, self._password = username, password

    def send(self, message: EmailMessage) -> None:
        mime = MimeMessage()
        mime["From"] = self._sender
        mime["To"] = message.to
        mime["Subject"] = message.subject
        mime.set_content(message.text)
        if message.html:
            mime.add_alternative(message.html, subtype="html")
        with smtplib.SMTP(self._host, self._port, timeout=10) as smtp:
            smtp.starttls()
            if self._username and self._password:
                smtp.login(self._username, self._password)
            smtp.send_message(mime)
