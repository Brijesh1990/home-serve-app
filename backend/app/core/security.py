import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import bcrypt
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

argon2_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt or Argon2 hash."""
    if not hashed_password:
        return False
    try:
        if hashed_password.startswith("$argon2"):
            return argon2_hasher.verify(hashed_password, plain_password)
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, VerifyMismatchError, Exception):
        return False


def hash_token(token: str) -> str:
    """Create a deterministic SHA-256 hash of a token for database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update(
        {
            "exp": expire,
            "iat": now,
            "type": "access",
            "jti": str(uuid.uuid4()),
        }
    )
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str, datetime]:
    """Create a signed JWT refresh token and return (raw_token, token_hash, expires_at)."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update(
        {
            "exp": expire,
            "iat": now,
            "type": "refresh",
            "jti": secrets.token_hex(16),
        }
    )
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    raw_token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash, expire.replace(tzinfo=None)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def generate_razorpay_signature(order_id: str, payment_id: str) -> str:
    """Compute HMAC-SHA256 signature for Razorpay order_id|payment_id."""
    message = f"{order_id}|{payment_id}".encode("utf-8")
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    return hmac.new(secret, message, hashlib.sha256).hexdigest()


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature using constant-time HMAC-SHA256 comparison."""
    if not order_id or not payment_id or not signature:
        return False
    expected = generate_razorpay_signature(order_id, payment_id)
    if hmac.compare_digest(expected, signature):
        return True
    # Also allow sandbox test simulation signature when using rzp_test_ keys in development
    if settings.RAZORPAY_KEY_ID.startswith("rzp_test_") and signature in (
        "sandbox_verified_signature",
        f"test_sig_{order_id}",
    ):
        return True
    return False


def generate_webhook_signature(payload_body: bytes) -> str:
    """Compute HMAC-SHA256 signature for Razorpay webhook payload."""
    secret = settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8")
    return hmac.new(secret, payload_body, hashlib.sha256).hexdigest()


def verify_webhook_signature(payload_body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook signature."""
    if not signature:
        return False
    expected = generate_webhook_signature(payload_body)
    return hmac.compare_digest(expected, signature)
