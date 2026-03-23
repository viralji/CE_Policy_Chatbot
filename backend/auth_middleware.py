"""
Auth for CE Policy Chatbot: Next.js proxy (X-Internal-Proxy-Secret + X-User-Email) or Bearer token.
When Azure is configured, accepts requests from Next.js with shared secret; otherwise Bearer JWT.
When INTERNAL_PROXY_SECRET is unset, a dev-only secret is accepted from localhost for local development.
"""
import os
from functools import wraps
from flask import request, jsonify, g

# Optional: use PyJWT for verification. Fallback if not installed.
try:
    import jwt
    from jwt import PyJWKClient
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

# Module-level JWKS client cache — reused across requests so we don't hit Microsoft's JWKS
# endpoint on every API call. PyJWKClient internally caches keys for 300 s by default.
_jwks_clients: dict = {}


def get_allowed_domain():
    return (os.getenv("ALLOWED_DOMAIN") or "cloudextel.com").strip().lower()


def get_azure_config():
    tenant_id = os.getenv("AZURE_AD_TENANT_ID", "").strip()
    client_id = os.getenv("AZURE_AD_CLIENT_ID", "").strip()
    return tenant_id, client_id


def validate_azure_id_token(token: str):
    """
    Validate Azure AD v2 ID token (from MSAL).
    Returns (payload dict, None) on success or (None, error_message) on failure.
    """
    if not JWT_AVAILABLE:
        return None, "Auth not configured (install PyJWT: pip install PyJWT cryptography)"

    tenant_id, client_id = get_azure_config()
    if not tenant_id or not client_id:
        return None, "Auth not configured (AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID)"

    try:
        if tenant_id not in _jwks_clients:
            jwks_uri = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
            _jwks_clients[tenant_id] = PyJWKClient(jwks_uri, cache_jwk_set=True, lifespan=300)
        jwks_client = _jwks_clients[tenant_id]
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=f"https://login.microsoftonline.com/{tenant_id}/v2.0",
            options={"verify_exp": True},
        )
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError as e:
        return None, str(e) or "Invalid token"


def get_email_from_payload(payload):
    """Extract email from Azure ID token payload."""
    email = (payload.get("preferred_username") or payload.get("email") or payload.get("upn") or "").strip()
    return email if "@" in email else None


def require_auth(f):
    """Decorator: require valid auth via Next.js proxy (X-Internal-Proxy-Secret + X-User-Email) or Bearer token."""

    @wraps(f)
    def wrapped(*args, **kwargs):
        # Skip auth if Azure is not configured (local dev)
        tenant_id, client_id = get_azure_config()
        if not tenant_id or not client_id:
            g.user = {"email": "dev@local", "name": "Dev User"}
            return f(*args, **kwargs)

        # Next.js proxy: accept internal secret + user email (restrict to localhost)
        secret = os.getenv("INTERNAL_PROXY_SECRET", "").strip()
        # Local dev: when unset, accept "dev-secret" from localhost only (never in production)
        dev_secret = "dev-secret"
        if not secret:
            secret = dev_secret
        proxy_secret = (request.headers.get("X-Internal-Proxy-Secret") or "").strip()
        user_email = (request.headers.get("X-User-Email") or "").strip()
        if proxy_secret == secret and user_email:
            remote = (request.remote_addr or "").strip()
            if remote in ("127.0.0.1", "::1", ""):
                g.user = {
                    "email": user_email,
                    "name": (request.headers.get("X-User-Name") or "").strip() or user_email,
                }
                return f(*args, **kwargs)
        # If we used dev_secret fallback, don't fall through to Bearer (we already rejected)
        if secret == dev_secret:
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth[7:].strip()
        if not token:
            return jsonify({"error": "Missing token"}), 401

        payload, err = validate_azure_id_token(token)
        if err:
            return jsonify({"error": err}), 401

        email = get_email_from_payload(payload)
        if not email:
            return jsonify({"error": "Token has no email"}), 401

        domain = email.split("@")[-1].lower()
        allowed = get_allowed_domain()
        if domain != allowed:
            return jsonify({"error": f"Only {allowed} accounts can access this app"}), 403

        g.user = {
            "email": email,
            "name": (payload.get("name") or email),
        }
        return f(*args, **kwargs)

    return wrapped
