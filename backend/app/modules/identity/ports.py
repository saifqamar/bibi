"""Ports for identity's external services."""

from dataclasses import dataclass
from typing import Protocol


class SocialAuthError(Exception):
    pass


@dataclass(frozen=True)
class SocialIdentity:
    provider_id: str
    email: str
    name: str | None = None


class SocialAuthPort(Protocol):
    def verify(self, provider: str, id_token: str) -> SocialIdentity:
        """Verify a provider ID token and return the identity, or raise SocialAuthError."""
        ...


class DisabledSocialAuth:
    """Used until the owner picks social login providers ([OPEN] in spec 01)."""

    def verify(self, provider: str, id_token: str) -> SocialIdentity:
        raise SocialAuthError("Social login is not enabled")


class FakeSocialAuth:
    """Test adapter. Tokens look like ``fake:<provider_id>:<email>``."""

    providers = ("google", "apple")

    def verify(self, provider: str, id_token: str) -> SocialIdentity:
        if provider not in self.providers:
            raise SocialAuthError(f"Unsupported provider {provider}")
        parts = id_token.split(":")
        if len(parts) != 3 or parts[0] != "fake":
            raise SocialAuthError("Invalid ID token")
        return SocialIdentity(provider_id=parts[1], email=parts[2])
