---
name: python-security-best-practices
description: Python security patterns, input validation, authentication, authorization, encryption, secure coding, and common vulnerability prevention.
origin: ECC
---

# Python Security Best Practices

Security patterns for building secure Python applications.

## When to Activate

- Building secure Python applications
- Implementing authentication/authorization
- Protecting against common vulnerabilities
- Secure data handling
- Security audit preparation

## Input Validation

### Input Sanitization

```python
import re
from html import escape

def sanitize_input(user_input: str) -> str:
    """Sanitize user input."""
    if not isinstance(user_input, str):
        raise ValueError("Input must be string")

    # Remove null bytes
    sanitized = user_input.replace('\x00', '')

    # Trim whitespace
    sanitized = sanitized.strip()

    return sanitized

def sanitize_html(user_input: str) -> str:
    """Escape HTML to prevent XSS."""
    return escape(user_input)

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username(username: str) -> bool:
    """Validate username format."""
    if not username or len(username) < 3 or len(username) > 32:
        return False
    return bool(re.match(r'^[a-zA-Z0-9_-]+$', username))
```

### SQL Injection Prevention

```python
# BAD - Vulnerable to SQL injection
def get_user_vulnerable(username):
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)

# GOOD - Parameterized query
def get_user_safe(username):
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (username,))

# Using ORM (SQLAlchemy)
def get_user_orm(db_session, username: str):
    return db_session.query(User).filter(User.username == username).first()

# Using ORM with text()
from sqlalchemy import text
def get_user_text(db_session, username: str):
    result = db_session.execute(
        text("SELECT * FROM users WHERE username = :username"),
        {"username": username}
    )
    return result.fetchone()
```

### Command Injection Prevention

```python
import subprocess
import shlex

# BAD - Vulnerable to command injection
def get_file_vulnerable(filename):
    os.system(f"cat {filename}")

# GOOD - Use subprocess with shell=False
def get_file_safe(filename):
    # Validate filename
    if not re.match(r'^[a-zA-Z0-9_-]+\.txt$', filename):
        raise ValueError("Invalid filename")

    result = subprocess.run(
        ['cat', filename],
        capture_output=True,
        text=True,
        shell=False
    )
    return result.stdout

# Using shutil instead of shell commands
def read_file_safe(filepath):
    # Use allowed paths
    allowed_dir = '/var/data'
    full_path = os.path.realpath(filepath)

    if not full_path.startswith(allowed_dir):
        raise ValueError("Access denied")

    with open(full_path) as f:
        return f.read()
```

## Authentication

### Password Handling

```python
import bcrypt
import secrets

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed.encode('utf-8')
    )

def check_password_strength(password: str) -> dict:
    """Check password strength."""
    checks = {
        'length': len(password) >= 12,
        'uppercase': bool(re.search(r'[A-Z]', password)),
        'lowercase': bool(re.search(r'[a-z]', password)),
        'digit': bool(re.search(r'\d', password)),
        'special': bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    }
    checks['valid'] = all(checks.values())
    return checks
```

### Token-Based Authentication

```python
import jwt
import datetime
from functools import wraps
from flask import request, jsonify

SECRET_KEY = secrets.token_hex(32)  # Store securely!

def create_token(user_id: int, expires_in: int = 3600) -> str:
    """Create JWT token."""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

def token_required(f):
    """Decorator to require valid token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = verify_token(token)
            request.user_id = data['user_id']
        except ValueError as e:
            return jsonify({'error': str(e)}), 401

        return f(*args, **kwargs)
    return decorated
```

## Authorization

### Role-Based Access Control

```python
from enum import Enum
from functools import wraps

class Role(Enum):
    """User roles."""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

# Role hierarchy
ROLE_HIERARCHY = {
    Role.ADMIN: {Role.ADMIN, Role.MODERATOR, Role.USER, Role.GUEST},
    Role.MODERATOR: {Role.MODERATOR, Role.USER, Role.GUEST},
    Role.USER: {Role.USER, Role.GUEST},
    Role.GUEST: {Role.GUEST}
}

def has_role(user_role: Role, required_role: Role) -> bool:
    """Check if user has required role."""
    allowed_roles = ROLE_HIERARCHY.get(user_role, set())
    return required_role in allowed_roles

def require_role(required_role: Role):
    """Decorator to check role."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'user_role'):
                return jsonify({'error': 'Authentication required'}), 401

            if not has_role(request.user_role, required_role):
                return jsonify({'error': 'Insufficient permissions'}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Usage
@app.route('/admin')
@require_role(Role.ADMIN)
def admin_panel():
    return "Admin panel"
```

### Resource-Level Authorization

```python
class AuthorizationService:
    """Resource-level authorization."""

    @staticmethod
    def can_access_resource(user, resource) -> bool:
        """Check if user can access resource."""
        # Owner can always access
        if resource.owner_id == user.id:
            return True

        # Admin can access everything
        if user.role == Role.ADMIN:
            return True

        # Check resource permissions
        return resource.has_permission(user)

    @staticmethod
    def can_modify(user, resource) -> bool:
        """Check if user can modify resource."""
        if user.role == Role.ADMIN:
            return True

        return resource.owner_id == user.id

    @staticmethod
    def filter_accessible(user, resources) -> list:
        """Filter resources to only accessible ones."""
        return [r for r in resources if AuthorizationService.can_access_resource(user, r)]
```

## Data Protection

### Encryption

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import base64
import os

class EncryptionService:
    """Data encryption service."""

    @staticmethod
    def generate_key(password: str, salt: bytes = None) -> bytes:
        """Generate encryption key from password."""
        if salt is None:
            salt = os.urandom(16)

        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    @staticmethod
    def encrypt(data: str, key: bytes) -> str:
        """Encrypt data."""
        f = Fernet(key)
        encrypted = f.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    @staticmethod
    def decrypt(encrypted_data: str, key: bytes) -> str:
        """Decrypt data."""
        f = Fernet(key)
        decoded = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = f.decrypt(decoded)
        return decrypted.decode()

# Field-level encryption for sensitive data
class EncryptedField:
    """Encrypt/decrypt fields automatically."""
    def __init__(self, key: bytes):
        self.key = key

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        encrypted = obj.__dict__.get('_encrypted_value')
        if encrypted:
            return EncryptionService.decrypt(encrypted, self.key)
        return None

    def __set__(self, obj, value):
        encrypted = EncryptionService.encrypt(str(value), self.key)
        obj.__dict__['_encrypted_value'] = encrypted
```

### Secure File Handling

```python
import os
import tempfile

def secure_file_upload(filepath: str, allowed_extensions: set) -> bool:
    """Securely handle file uploads."""
    # Check extension
    ext = os.path.splitext(filepath)[1].lower()
    if ext not in allowed_extensions:
        return False

    # Use secure filename
    filename = os.path.basename(filepath)
    safe_filename = re.sub(r'[^\w.-]', '', filename)

    # Write to temp location first
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(uploaded_content)
        tmp_path = tmp.name

    # Move to final location (atomically)
    final_path = os.path.join(UPLOAD_DIR, safe_filename)
    os.rename(tmp_path, final_path)

    return True
```

## Web Security

### CORS Configuration

```python
from flask_cors import CORS

# Secure CORS configuration
CORS(app, origins=['https://yourdomain.com'],
     methods=['GET', 'POST'],
     allow_headers=['Content-Type', 'Authorization'],
     expose_headers=['X-Request-ID'],
     max_age=3600,
     supports_credentials=True)

# For API-only access
CORS(app, resources={'/api/*': {'origins': '*'}})
```

### CSRF Protection

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)

# Generate CSRF token
@app.route('/form')
def form():
    return f'''
        <form method="POST">
            <input type="hidden" name="csrf_token"
                   value="{csrf.generate_token()}">
        </form>
    '''

# Or use in templates with Flask-WTF
# {{ csrf_token() }} in your form
```

### Security Headers

```python
from flask import Flask
from flask_talisman import Talisman

# Add security headers
Talisman(app,
         content_security_policy=None,  # Configure CSP
         force_https=True,
         strict_transport_security=True,
         frame_deny=True,
         x_content_type_options=True,
         x_xss_protection=True,
         referrer_policy='strict-origin-when-cross-origin')

# Manual headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

## Secret Management

### Environment Variables

```python
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Get secrets (with defaults for development)
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-not-for-production')
DATABASE_URL = os.getenv('DATABASE_URL')
API_KEY = os.getenv('API_KEY')

# Validate required secrets on startup
def validate_secrets():
    required = ['SECRET_KEY', 'DATABASE_URL']
    missing = [key for key in required if not os.getenv(key)]

    if missing:
        raise EnvironmentError(f"Missing required secrets: {', '.join(missing)}")
```

### Secret Rotation

```python
import boto3
from botocore.exceptions import ClientError
import json

class SecretManager:
    """AWS Secrets Manager integration."""

    def __init__(self):
        self.client = boto3.client('secretsmanager')

    def get_secret(self, secret_name: str) -> dict:
        """Retrieve secret."""
        try:
            response = self.client.get_secret_value(
                SecretId=secret_name
            )
            return json.loads(response['SecretString'])
        except ClientError as e:
            raise Exception(f"Failed to get secret: {e}")

    def rotate_secret(self, secret_name: str):
        """Trigger secret rotation."""
        self.client.rotate_secret(
            SecretId=secret_name
        )

# Usage
secrets = SecretManager()
db_creds = secrets.get_secret('prod/database')
```

## Vulnerability Prevention

### XML External Entity

```python
# BAD - Vulnerable to XXE
def parse_xml_vulnerable(xml_data):
    import xml.etree.ElementTree as ET
    return ET.fromstring(xml_data)

# GOOD - Disable entity expansion
def parse_xml_safe(xml_data):
    import defusedxml.ElementTree as ET
    return ET.fromstring(xml_data)
```

### YAML Safe Loading

```python
import yaml

# BAD - Vulnerable to code execution
data = yaml.unsafe_load(user_input)

# GOOD - Safe load
data = yaml.safe_load(user_input)

# For untrusted input, use restricted loader
data = yaml.load(user_input, Loader=yaml.FullLoader)
```

### Path Traversal Prevention

```python
def safe_file_access(requested_path: str, base_dir: str) -> str:
    """Prevent path traversal attacks."""
    # Resolve to absolute path
    base = os.path.realpath(base_dir)
    target = os.path.realpath(os.path.join(base_dir, requested_path))

    # Ensure target is within base directory
    if not target.startswith(base):
        raise ValueError("Access denied")

    return target
```

## Security Logging

### Security Event Logging

```python
import logging
from datetime import datetime

security_logger = logging.getLogger('security')

def log_login_attempt(username: str, success: bool, ip: str):
    """Log login attempts."""
    security_logger.warning(
        f"Login attempt: user={username}, success={success}, ip={ip}, "
        f"time={datetime.utcnow().isoformat()}"
    )

def log_access_denied(user_id: str, resource: str, reason: str):
    """Log access denied events."""
    security_logger.warning(
        f"Access denied: user={user_id}, resource={resource}, "
        f"reason={reason}, time={datetime.utcnow().isoformat()}"
    )

def log_suspicious_activity(activity: str, details: dict):
    """Log suspicious activity."""
    security_logger.error(
        f"Suspicious activity: {activity}, details={details}, "
        f"time={datetime.utcnow().isoformat()}"
    )
```

## Quick Reference

| Vulnerability | Prevention |
|--------------|------------|
| SQL Injection | Parameterized queries, ORMs |
| XSS | Input sanitization, output encoding |
| CSRF | CSRF tokens |
| Command Injection | shell=False, input validation |
| XXE | Use defusedxml, disable entities |
| Path Traversal | Path normalization, bounds check |
| Secrets in code | Environment variables, secret managers |

| Security Measure | Implementation |
|-----------------|----------------|
| Password hashing | bcrypt (12+ rounds) |
| JWT tokens | Short expiry, sign with strong key |
| Encryption | cryptography library |
| HTTPS | TLS 1.2+, strong ciphers |
| Rate limiting | Request throttling |
| Logging | Security event logging |

Remember: Defense in depth - assume any single measure can be compromised. Layer your security.