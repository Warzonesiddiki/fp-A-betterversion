---
name: python-logging-best-practices
description: Python logging configuration, structured logging, log levels, formatters, handlers, custom loggers, and production logging strategies.
origin: ECC
---

# Python Logging Best Practices

Production-grade logging patterns for Python applications.

## When to Activate

- Setting up application logging
- Debugging production issues
- Structured logging implementation
- Log aggregation setup
- Monitoring and observability

## Basic Configuration

### Simple Setup

```python
import logging
import sys

# Basic configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)
logger.info("Application started")
```

### Structured Configuration

```python
import logging

# Detailed configuration
logging.config.dictConfig({
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s - %(funcName)s:%(lineno)d - %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'INFO',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'class': 'logging.FileHandler',
            'level': 'DEBUG',
            'formatter': 'detailed',
            'filename': 'app.log',
            'mode': 'a'
        }
    },
    'loggers': {
        'myapp': {
            'level': 'DEBUG',
            'handlers': ['console', 'file'],
            'propagate': False
        }
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console']
    }
})
```

## Logger Hierarchy

### Named Loggers

```python
import logging

# Create logger for specific module
logger = logging.getLogger('myapp.orders')

# Child loggers inherit parent settings
order_logger = logging.getLogger('myapp.orders.service')
payment_logger = logging.getLogger('myapp.payments')

# Log hierarchy
# myapp
# ├── myapp.orders
# │   └── myapp.orders.service
# └── myapp.payments
```

### Logger Configuration

```python
import logging

# Get or create logger
logger = logging.getLogger('myapp')

# Set level
logger.setLevel(logging.DEBUG)

# Add handler
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)

# Set formatter
formatter = logging.Formatter('%(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Prevent propagation to root (avoid duplicate logs)
logger.propagate = False
```

## Structured Logging

### JSON Logging

```python
import logging
import json
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add extra fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id

        return json.dumps(log_data)

# Usage
logger = logging.getLogger('myapp')
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger.addHandler(handler)
logger.info('User logged in', extra={'user_id': 123})
```

### Structured Logging with Extra

```python
import logging
from dataclasses import dataclass
from typing import Any

@dataclass
class LogContext:
    """Structured log context."""
    user_id: str = None
    request_id: str = None
    session_id: str = None

class StructuredLogger:
    """Logger with structured logging support."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def _log(self, level: int, message: str, **kwargs: Any):
        extra = {'extra_data': kwargs}
        self.logger.log(level, message, extra=extra)

    def info(self, message: str, **kwargs: Any):
        self._log(logging.INFO, message, **kwargs)

    def error(self, message: str, **kwargs: Any):
        self._log(logging.ERROR, message, **kwargs)

    def log(self, level: int, message: str, **kwargs: Any):
        """Log with structured data."""
        log_entry = {
            'message': message,
            **kwargs
        }
        self.logger.log(level, json.dumps(log_entry))

logger = StructuredLogger('myapp')
logger.info('User action', user_id='123', action='click', button='save')
```

## Log Levels and Usage

### Appropriate Log Levels

```python
import logging

logger = logging.getLogger(__name__)

# DEBUG: Detailed information for diagnosing problems
logger.debug("Entering function %s with args: %s", func_name, args)
logger.debug("Query: %s", query)
logger.debug("Response time: %sms", response_time)

# INFO: Confirmation that things work as expected
logger.info("Application started successfully")
logger.info("User %s logged in", username)
logger.info("Processed %d records", count)

# WARNING: Something unexpected happened, but the app still works
logger.warning("Retrying connection (attempt %d)", attempt)
logger.warning("Cache miss for key: %s", cache_key)
logger.warning("Deprecated API called: %s", api_name)

# ERROR: Serious problem, function didn't work
logger.error("Failed to connect to database: %s", error)
logger.error("Invalid request from user %s", user_id)
logger.error("Payment processing failed: %s", error)

# CRITICAL: Very serious error, program may crash
logger.critical("Database connection lost completely")
logger.critical("Out of memory, shutting down")
```

### Conditional Logging

```python
# Expensive operations only in debug mode
def expensive_debug_info():
    return f"Debug info: {heavy_computation()}"

# Use isEnabledFor to avoid expensive operations
if logger.isEnabledFor(logging.DEBUG):
    logger.debug("Complex debug: %s", expensive_debug_info())

# Lazy string formatting
logger.debug("Request: %s", lambda: expensive_format(request))

# Use % formatting, not f-strings (evaluation delayed)
logger.debug("User data: %s", user_data)  # Only evaluates if DEBUG enabled
```

## Handlers

### Multiple Handlers

```python
import logging
from logging.handlers import (
    RotatingFileHandler, TimedRotatingFileHandler,
    SMTPHandler, SysLogHandler
)

logger = logging.getLogger('myapp')

# Console handler for all logs
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)

# Rotating file handler for all logs
file_handler = RotatingFileHandler(
    'app.log',
    maxBytes=10_000_000,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)

# Error-only file handler
error_handler = RotatingFileHandler('errors.log')
error_handler.setLevel(logging.ERROR)

# Add handlers to logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)
logger.addHandler(error_handler)
```

### Timed Rotating Handler

```python
from logging.handlers import TimedRotatingFileHandler

# Rotate at midnight every day, keep 30 days
handler = TimedRotatingFileHandler(
    'app.log',
    when='midnight',
    interval=1,
    backupCount=30
)
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))

# Rotate every hour, keep last 24 hours
hourly_handler = TimedRotatingFileHandler(
    'app.log',
    when='H',
    interval=1,
    backupCount=24
)
```

### Syslog Handler

```python
import logging
from logging.handlers import SysLogHandler

# Send logs to syslog
syslog_handler = SysLogHandler(address='/dev/log')
syslog_handler.setFormatter(logging.Formatter(
    'myapp: %(levelname)s - %(message)s'
))

logger.addHandler(syslog_handler)

# Remote syslog
remote_syslog = SysLogHandler(address=('logs.example.com', 514))
logger.addHandler(remote_syslog)
```

## Custom Loggers

### Application Logger

```python
import logging

class AppLogger:
    """Application logger with convenience methods."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log_request(self, method: str, path: str, status: int, duration: float):
        """Log HTTP request."""
        self.logger.info(
            "%s %s - %d - %.2fms",
            method, path, status, duration
        )

    def log_error_with_context(self, error: Exception, context: dict):
        """Log error with context."""
        self.logger.error(
            "%s: %s",
            type(error).__name__,
            str(error),
            extra={'error_context': context}
        )

    def log_user_action(self, user_id: str, action: str, details: dict = None):
        """Log user action."""
        self.logger.info(
            "User %s: %s",
            user_id,
            action,
            extra={'user_action': action, 'details': details or {}}
        )

logger = AppLogger('myapp')
logger.log_request('GET', '/api/users', 200, 45.2)
```

### Context Logger

```python
import logging
from contextvars import ContextVar
from datetime import datetime

# Request context
request_id_var: ContextVar[str] = ContextVar('request_id', default='')
user_id_var: ContextVar[str] = ContextVar('user_id', default='')

class ContextFilter(logging.Filter):
    """Add context to log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_var.get()
        record.user_id = user_id_var.get()
        return True

# Add filter to handler
handler.addFilter(ContextFilter())

# Usage in request handler
async def handle_request(request):
    request_id_var.set(request.headers.get('X-Request-ID'))
    user_id_var.set(request.user.id)
    logger.info("Processing request")
```

## Production Configuration

### Environment-Based Config

```python
import logging
import os

def setup_logging():
    """Setup logging based on environment."""
    level = logging.DEBUG if os.getenv('DEBUG') else logging.INFO

    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Add file handler in production
    if os.getenv('ENV') == 'production':
        setup_production_handlers()

def setup_production_handlers():
    """Production-specific logging setup."""
    handler = logging.handlers.RotatingFileHandler(
        '/var/log/myapp/app.log',
        maxBytes=10_000_000,
        backupCount=10
    )
    handler.setLevel(logging.INFO)
    handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logging.getLogger().addHandler(handler)
```

### Third-Party Library Control

```python
import logging

# Configure third-party loggers
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('requests').setLevel(logging.WARNING)
logging.getLogger('boto3').setLevel(logging.WARNING)
logging.getLogger('botocore').setLevel(logging.WARNING)
logging.getLogger('asyncio').setLevel(logging.WARNING)

# Disable noisy loggers
logging.getLogger('matplotlib').setLevel(logging.ERROR)
logging.getLogger('PIL').setLevel(logging.ERROR)
```

## Log Aggregation

### ELK Stack Integration

```python
import logging
import json

class ElasticHandler(logging.Handler):
    """Send logs to Elasticsearch."""

    def __init__(self, elastic_url: str, index: str):
        super().__init__()
        self.elastic_url = elastic_url
        self.index = index

    def emit(self, record: logging.LogRecord):
        try:
            log_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'message': record.getMessage(),
                'logger': record.name,
            }

            if record.exc_info:
                log_data['exception'] = self.format(record.exc_info)

            # Send to Elasticsearch
            requests.post(
                f"{self.elastic_url}/{self.index}/_doc",
                json=log_data
            )
        except Exception:
            self.handleError(record)
```

## Quick Reference

| Level | Use For |
|-------|---------|
| DEBUG | Diagnostic information |
| INFO | Normal operation events |
| WARNING | Unexpected but handled |
| ERROR | Serious problem occurred |
| CRITICAL | Program may crash |

| Handler | Use Case |
|---------|----------|
| StreamHandler | Console output |
| FileHandler | File logging |
| RotatingFileHandler | Log rotation |
| TimedRotatingFileHandler | Time-based rotation |
| SysLogHandler | System logging |
| SMTPHandler | Email alerts |

Remember: Don't log sensitive data (passwords, tokens, PII). Use structured logging for production.