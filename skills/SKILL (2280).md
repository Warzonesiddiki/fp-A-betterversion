---
name: oauth-oidc-patterns
description: OAuth 2.0 and OpenID Connect implementation patterns for secure authentication and authorization. Covers flows, token validation, client patterns, and common security pitfalls.
triggers:
  - /oauth
  - /oidc
  - /authentication
  - /auth-flow
useCases:
  - "Implementing login with Google"
  - "Securing API with OAuth"
  - "Setting up SSO with OIDC"
  - "Token validation in microservices"
tags:
  - security
  - oauth
  - oidc
  - authentication
  - sso
---

# OAuth 2.0 and OpenID Connect Patterns

## Core Concepts

```yaml
oauth_flows:
  authorization_code:
    use_case: "Server-side apps, SPAs"
    security: "High (no secrets in browser)"
    
  client_credentials:
    use_case: "Machine-to-machine APIs"
    security: "High (with proper client secrets)"
    
  device_code:
    use_case: "CLI tools, smart TVs"
    security: "Medium"
    
  implicit:
    status: "Deprecated - use Authorization Code + PKCE"
    reason: "Token exposure in browser history"
```

## Authorization Code Flow with PKCE

### Flow Diagram

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   User   │     │  Your App   │     │ Auth Server  │     │   API      │
└────┬────┘     └──────┬──────┘     └──────┬───────┘     └──────┬─────┘
     │                  │                    │                   │
     │  1. Click Login  │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │  2. Generate     │                    │                   │
     │     code_verifier│                    │                   │
     │     code_challenge                    │                   │
     │     (SHA256)     │                    │                   │
     │                  │                    │                   │
     │  3. Redirect     │                    │                   │
     │     /authorize   │                    │                   │
     │     ?client_id    │                    │                   │
     │     &redirect_uri │                    │                   │
     │     &code_challenge                    │                   │
     │     &state       │                    │                   │
     │────────────────────────────────────────>│                   │
     │                  │                    │                   │
     │  4. Login Form    │                    │                   │
     │<─────────────────────────────────────────│                   │
     │                  │                    │                   │
     │  5. User Auth     │                    │                   │
     │─────────────────>│                    │                   │
     │                  │                    │                   │
     │  6. Redirect     │                    │                   │
     │     /callback    │                    │                   │
     │     ?code        │                    │                   │
     │     &state       │                    │                   │
     │<─────────────────────────────────────────│                   │
     │                  │                    │                   │
     │  7. Exchange code│                    │                   │
     │     for tokens   │                    │                   │
     │     +code_verifier                    │                   │
     │────────────────────────────────────────>│                   │
     │                  │                    │                   │
     │  8. access_token │                    │                   │
     │     id_token     │                    │                   │
     │<─────────────────────────────────────────│                   │
     │                  │                    │                   │
     │  9. Call API     │                    │                   │
     │     with token   │                    │                   │
     │────────────────────────────────────────────────────>        │
```

### Python Implementation

```python
import hashlib
import base64
import secrets
import httpx
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

app = FastAPI()

class OAuthState(BaseModel):
    state: str
    code_verifier: str
    redirect_uri: str

# Store state in Redis/Session
STATE_STORE: dict[str, OAuthState] = {}

def generate_pkce():
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')
    return code_verifier, code_challenge

@app.get("/login")
async def login():
    state = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce()
    
    # Store state for callback
    STATE_STORE[state] = OAuthState(
        state=state,
        code_verifier=code_verifier,
        redirect_uri="https://myapp.com/callback"
    )
    
    auth_url = (
        f"https://auth.example.com/authorize"
        f"?client_id=YOUR_CLIENT_ID"
        f"&response_type=code"
        f"&redirect_uri=https://myapp.com/callback"
        f"&scope=openid profile email"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )
    return RedirectResponse(auth_url)

@app.get("/callback")
async def callback(code: str, state: str, request: Request):
    if state not in STATE_STORE:
        raise HTTPException(400, "Invalid state")
    
    oauth_state = STATE_STORE.pop(state)
    
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://auth.example.com/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": oauth_state.redirect_uri,
                "client_id": "YOUR_CLIENT_ID",
                "code_verifier": oauth_state.code_verifier,
            }
        )
    
    tokens = response.json()
    return tokens  # Contains access_token, refresh_token, id_token
```

## Token Validation

### JWT Validation Checklist

```python
import jwt
from jwt import PyJWKClient

class TokenValidator:
    JWKS_URL = "https://auth.example.com/.well-known/jwks.json"
    
    def __init__(self):
        self.jwks_client = PyJWKClient(self.JWKS_URL)
    
    async def validate_token(self, token: str) -> dict:
        # 1. Verify signature with JWKS
        signing_key = self.jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_signature": True}
        )
        
        # 2. Validate claims
        now = time.time()
        
        if payload['exp'] < now:
            raise TokenExpiredError("Token expired")
        
        if payload['iat'] > now + 60:
            raise InvalidClaimError("Token issued in future")
        
        if payload.get('nbf', 0) > now + 60:
            raise InvalidClaimError("Token not yet valid")
        
        # 3. Validate audience
        valid_audiences = ["my-api", "my-app"]
        if payload.get('aud') not in valid_audiences:
            if not any(aud in payload.get('aud', []) for aud in valid_audiences):
                raise InvalidAudienceError("Invalid audience")
        
        # 4. Validate issuer
        valid_issuers = ["https://auth.example.com"]
        if payload['iss'] not in valid_issuers:
            raise InvalidIssuerError("Invalid issuer")
        
        return payload
```

## OIDC Claims Reference

| Claim | Description | Required |
|-------|-------------|----------|
| iss | Issuer URL | Yes |
| sub | Subject identifier | Yes |
| aud | Audience (client_id or array) | Yes |
| exp | Expiration time | Yes |
| iat | Issued at | Yes |
| nonce | For replay protection | Conditional |
| email | User email | Optional |
| name | User full name | Optional |
| preferred_username | Username | Optional |
| at_hash | Access token hash | For implicit/hybrid |

## Client Credentials Flow

### Machine-to-Machine Auth

```python
import httpx

async def get_service_token():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://auth.example.com/token",
            data={
                "grant_type": "client_credentials",
                "client_id": "service-account-id",
                "client_secret": os.environ["CLIENT_SECRET"],
                "scope": "api://my-api/.default",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
    return response.json()["access_token"]

# Use with API calls
async def call_protected_api():
    token = await get_service_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.my-service.com/data",
            headers={"Authorization": f"Bearer {token}"}
        )
    return response.json()
```

## Security Anti-Patterns

```yaml
dangerous_patterns:
  - id: "hardcoded_tokens"
    example: "token = 'eyJ...' # NEVER DO THIS"
    fix: "Use environment variables or secrets manager"
    
  - id: "weak_signature_alg"
    example: "algorithm='HS256' with shared secret in code"
    fix: "Use RS256/ES256, keep private keys secure"
    
  - id: "no_token_validation"
    example: "return user_id from unvalidated token"
    fix: "Always validate signature, exp, aud, iss"
    
  - id: "refresh_token_in_url"
    example: "redirect_uri?refresh_token=xyz"
    fix: "Use POST for token exchange, secure storage"
    
  - id: "missing_state_param"
    example: "No CSRF protection in OAuth flow"
    fix: "Always use state parameter, validate on callback"
```

## Token Refresh Pattern

```python
from datetime import datetime, timedelta
from functools import lru_cache

class TokenManager:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token = None
        self._expires_at = None
    
    async def get_valid_token(self) -> str:
        if self._access_token and self._expires_at:
            if datetime.now() < self._expires_at - timedelta(minutes=5):
                return self._access_token
        
        # Refresh token
        new_token = await self._refresh_token()
        self._access_token = new_token["access_token"]
        self._expires_at = datetime.now() + timedelta(seconds=new_token["expires_in"])
        return self._access_token
    
    async def _refresh_token(self) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://auth.example.com/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self._refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                }
            )
        return response.json()
```

## Multi-Factor Authentication

```python
# Verify MFA claim in ID token
def verify_mfa(token_payload: dict) -> bool:
    amr = token_payload.get("amr", [])  # Authentication Methods References
    acr = token_payload.get("acr", "")
    
    # AMR-based check
    if "mfa" in amr or "otp" in amr or "swk" in amr:
        return True
    
    # ACR-based check (authentication context class)
    valid_acrs = ["http://schemas.openid.net/pape/policies/2007/06/multi-factor"]
    if acr in valid_acrs:
        return True
    
    return False
```

## API Authorization Patterns

```python
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

oauth2_scheme = HTTPBearer()

async def require_scope(required_scope: str):
    async def scope_checker(
        credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
    ):
        token = credentials.credentials
        payload = await token_validator.validate_token(token)
        
        # Check scopes
        token_scopes = payload.get("scope", "").split()
        if required_scope not in token_scopes:
            raise HTTPException(403, f"Missing required scope: {required_scope}")
        
        return payload
    
    return scope_checker

# Usage in endpoint
@app.get("/admin")
async def admin_endpoint(
    user: dict = Depends(require_scope("admin:read"))
):
    return {"message": "Admin data"}
```
```
