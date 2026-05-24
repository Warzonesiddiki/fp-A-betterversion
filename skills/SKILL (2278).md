---
name: security-code-review
description: Security-focused code review methodology, common vulnerability patterns, and remediation guidance for identifying security issues in code.
triggers:
  - /security-review
  - /code-security
  - /security-findings
  - /secure-coding
useCases:
  - "Reviewing PR for security issues"
  - "Finding vulnerabilities in code"
  - "Security checklist for code review"
  - "Remediating security findings"
tags:
  - security
  - code-review
  - vulnerabilities
  - secure-coding
---

# Security Code Review

## Review Methodology

### Security Review Checklist

```yaml
review_phases:
  discovery:
    - Identify data flows (input -> process -> output)
    - Map authentication/authorization points
    - Find external integrations (APIs, DBs, caches)
    - Locate secrets handling code
    
  analysis:
    - Check input validation and sanitization
    - Review authentication mechanisms
    - Verify authorization logic
    - Examine cryptographic implementations
    - Audit error handling
    
  verification:
    - Confirm security controls exist
    - Test edge cases and boundaries
    - Verify logging/monitoring
    - Check configuration management
```

## OWASP Top 10 Review Guide

### A01 - Broken Access Control

```python
# VULNERABLE: Missing authorization check
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return db.query(User).filter(User.id == user_id).first()

# SECURE: Authorization check
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(403, "Access denied")
    return db.query(User).filter(User.id == user_id).first()

# VULNERABLE: IDOR - direct object reference
@app.get("/documents/{doc_id}")
def get_doc(doc_id):
    return Document.get(doc_id)

# SECURE: Authorization with ownership check
@app.get("/documents/{doc_id}")
def get_doc(doc_id, user = Depends(get_current_user)):
    doc = Document.get(doc_id)
    if not doc or doc.owner_id != user.id:
        raise HTTPException(403)
    return doc
```

### A02 - Cryptographic Failures

```python
# VULNERABLE: Weak hashing
import hashlib
password_hash = hashlib.md5(password)  # NEVER

# SECURE: Strong hashing with salt
import bcrypt
password_hash = bcrypt.hashpw(
    password.encode(),
    bcrypt.gensalt(rounds=12)
)

# VULNERABLE: Hardcoded key
SECRET_KEY = "my-secret-key"  # NEVER

# SECURE: Environment-based key
import os
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set")

# VULNERABLE: Weak encryption
from cryptography.fernet import Fernet
cipher = Fernet(key)  # Key must be from proper source

# SECURE: Use proper key derivation
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.primitives.kdf.concatkdf import HKDF

def derive_key(password: str, salt: bytes) -> bytes:
    kdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        info=b"encryption-key",
    )
    return kdf.derive(password.encode())
```

### A03 - Injection

```python
# VULNERABLE: SQL Injection
user_input = request.args.get("username")
query = f"SELECT * FROM users WHERE name = '{user_input}'"  # NEVER
db.execute(query)

# SECURE: Parameterized query
user_input = request.args.get("username")
query = "SELECT * FROM users WHERE name = :username"
db.execute(query, {"username": user_input})

# Using SQLAlchemy ORM (recommended)
users = User.query.filter(User.username == username).all()

# VULNERABLE: Command Injection
filename = request.args.get("file")
os.system(f"cat {filename}")  # NEVER

# SECURE: Use subprocess with shell=False
import subprocess
result = subprocess.run(
    ["cat", filename],  # Safe: list, not shell
    capture_output=True,
    text=True
)

# VULNERABLE: XSS
@app.get("/hello")
def hello(name):
    return f"<h1>Hello {name}</h1>"  # NEVER

# SECURE: Template auto-escaping
from jinja2 import Template
template = Template("<h1>Hello {{ name }}</h1>")  # Auto-escapes

# Or explicit escaping
from markupsafe import escape
@app.get("/hello")
def hello(name):
    return f"<h1>Hello {escape(name)}</h1>"
```

### A04 - Insecure Design

```python
# VULNERABLE: No rate limiting
@app.post("/login")
def login(username, password):
    if verify(username, password):
        return "success"

# SECURE: Rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/login")
@limiter.limit("5/minute")
def login(username, password):
    ...

# VULNERABLE: Predictable IDs
def generate_id():
    return str(uuid.uuid4())  # OK but check usage

# Better: Use sequential with proper auth
class SecureIDGenerator:
    @staticmethod
    def generate_id() -> str:
        # Use ULID for sortability + uniqueness
        import ulid
        return ulid.ULID()
```

### A05 - Security Misconfiguration

```yaml
security_config_check:
  # Flask/Django
  - DEBUG: false  # Never in production
  - SECRET_KEY: from env, never hardcoded
  - ALLOWED_HOSTS: specific domains only
  
  # CORS
  - origins: specific domains only
  - methods: minimal required
  - credentials: true only if needed
  
  # Headers
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000
  - Content-Security-Policy: restrictive
```

### A06 - Vulnerable Components

```bash
# Check dependencies
pip-audit
npm audit
trivy fs --security-checks vuln .
syft . -o json | grype

# Requirements example
# requirements.txt
flask==3.0.0  # Pin exact versions
requests==2.31.0
cryptography==42.0.0
```

### A07 - Auth Failures

```python
# VULNERABLE: Weak password validation
def validate_password(password):
    return len(password) >= 6

# SECURE: Strong password requirements
import re
def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 12:
        return False, "Min 12 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Uppercase required"
    if not re.search(r"[a-z]", password):
        return False, "Lowercase required"
    if not re.search(r"[0-9]", password):
        return False, "Number required"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Special character required"
    return True, "Valid"

# VULNERABLE: No account lockout (brute force friendly)
def login(username, password):
    return verify(username, password)

# SECURE: Account lockout
from datetime import datetime, timedelta
from collections import defaultdict

login_attempts = defaultdict(list)  # Redis in production

def login(username, password):
    # Check for lockout
    recent = [t for t in login_attempts[username] 
              if t > datetime.now() - timedelta(minutes=15)]
    if len(recent) >= 5:
        raise HTTPException(429, "Account locked")
    
    if verify(username, password):
        login_attempts[username].clear()
        return "success"
    
    login_attempts[username].append(datetime.now())
    raise HTTPException(401, "Invalid credentials")
```

### A08 - Data Exposure

```python
# VULNERABLE: Exposing sensitive data
@app.get("/user/{user_id}")
def get_user(user_id):
    user = User.get(user_id)
    return {
        "id": user.id,
        "name": user.name,
        "ssn": user.ssn,  # NEVER
        "credit_card": user.cc,  # NEVER
    }

# SECURE: Selective field exposure
from pydantic import BaseModel, ConfigDict

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    # Omit: ssn, cc, password_hash

@app.get("/user/{user_id}")
def get_user(user_id):
    user = User.get(user_id)
    return UserPublic.model_validate(user)

# SECURE: Data masking in responses
def mask_sensitive_data(data: dict) -> dict:
    sensitive_fields = ["ssn", "credit_card", "password"]
    for field in sensitive_fields:
        if field in data:
            data[field] = "***MASKED***"
    return data
```

### A09 - SSRF Protection

```python
# VULNERABLE: User-provided URL
user_url = request.args.get("url")
response = requests.get(user_url)  # Can hit internal services!

# SECURE: URL validation and allowlist
import ipaddress
from urllib.parse import urlparse

BLOCKED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "metadata.google.internal",  # Cloud metadata
    "169.254.169.254",  # AWS metadata
]

def validate_url(url: str) -> bool:
    parsed = urlparse(url)
    hostname = parsed.hostname
    
    # Check for IP literals
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback:
            return False
    except ValueError:
        pass
    
    # Check blocked hosts
    if hostname in BLOCKED_HOSTS:
        return False
    
    # Block internal ranges
    for octet in hostname.split("."):
        if octet.startswith("10.") or hostname.startswith("192.168."):
            return False
    
    # Only allow HTTPS
    if parsed.scheme != "https":
        return False
    
    return True

# Usage
if validate_url(user_url):
    response = requests.get(user_url, timeout=5)
```

### A10 - Logging & Monitoring

```python
import logging
import json
from datetime import datetime

# SECURE: Structured security logging
security_logger = logging.getLogger("security")

def log_security_event(event_type: str, user_id: str, 
                       details: dict, severity: str = "INFO"):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "severity": severity,
        "details": details,
        # Never log: passwords, tokens, full card numbers
    }
    security_logger.warning(json.dumps(entry))

# Usage examples
log_security_event("login_failed", username, 
                   {"ip": request.remote_addr, "attempts": 3}, "WARNING")
log_security_event("access_denied", user_id,
                   {"resource": "/admin", "reason": "insufficient_privilege"}, "WARNING")
log_security_event("data_access", user_id,
                   {"resource": "PII", "action": "export"}, "INFO")
```

## Review Output Format

```markdown
## Security Code Review: PR #1234

**Repository**: myorg/myapp
**Branch**: feature/user-profile
**Reviewer**: Security Team
**Date**: 2024-01-15

### Summary
- **Risk Level**: Medium
- **Files Reviewed**: 12
- **Findings**: 5 (2 High, 2 Medium, 1 Low)
- **Recommendation**: Address High findings before merge

### High Findings

#### H-01: SQL Injection in User Search
**File**: src/handlers/user.py:45
**Severity**: Critical

```python
# Vulnerable code
query = f"SELECT * FROM users WHERE name LIKE '%{search_term}%'"
```

**Recommendation**: Use parameterized queries or ORM.

#### H-02: Hardcoded API Key
**File**: src/config.py:12
**Severity**: High

```python
API_KEY = "sk_live_abc123..."  # Should be env var
```

**Recommendation**: Load from environment or secrets manager.

### Medium Findings
[...]

### Low Findings
[...]
```

## Tools for Security Review

| Tool | Purpose | Integration |
|------|---------|-------------|
| Semgrep | SAST | CI/CD |
| SonarQube | Code quality + security | IDE, CI |
| GitHub CodeQL | Static analysis | PR checks |
| Snyk | Dependency scanning | CI |
| Trivy | Container/image scanning | CI |
| Burp Suite | Web testing | Manual |
| OWASP ZAP | Automated scanning | CI |
```
