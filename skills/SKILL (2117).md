---
name: http-client-best-practices
description: Comprehensive guidance for building robust, efficient, and maintainable HTTP clients with best practices from MCP tools.
origin: MCP Market
---
# HTTP Client Best Practices

## Overview

This skill provides comprehensive guidance for building robust, efficient, and maintainable HTTP clients. Based on patterns from MCP tools like Make Your Own (curl-based fetching), Fetcher, and various HTTP clients.

## Key Concepts

### 1. Client Configuration

\\\python
import httpx
from typing import Optional, Dict, Any
from dataclasses import dataclass
import time

@dataclass
class HTTPClientConfig:
    """Configuration for HTTP client"""
    base_url: str = ""
    timeout: float = 30.0
    max_retries: int = 3
    max_keepalive_connections: int = 20
    max_connections: int = 100
    follow_redirects: bool = True
    verify_ssl: bool = True
    
    # Custom headers
    default_headers: Dict[str, str] = None
    
    # Authentication
    auth: Optional[httpx.Auth] = None
    
    # Proxy
    proxies: Optional[Dict[str, str]] = None

class OptimizedHTTPClient:
    """Production-ready HTTP client with best practices"""
    
    def __init__(self, config: HTTPClientConfig):
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            limits = httpx.Limits(
                max_keepalive_connections=self.config.max_keepalive_connections,
                max_connections=self.config.max_connections
            )
            
            self._client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=httpx.Timeout(self.config.timeout),
                limits=limits,
                follow_redirects=self.config.follow_redirects,
                verify=self.config.verify_ssl,
                headers=self.config.default_headers,
                auth=self.config.auth,
                proxies=self.config.proxies
            )
        
        return self._client
    
    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None
\\\

### 2. Request Building

\\\python
from typing import Optional, Dict, Any
from enum import Enum
import json

class HTTPMethod(Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"

class RequestBuilder:
    """Build HTTP requests with proper structure"""
    
    def __init__(self, method: HTTPMethod, url: str):
        self.method = method
        self.url = url
        self._headers: Dict[str, str] = {}
        self._params: Dict[str, Any] = {}
        self._body: Any = None
        self._timeout: Optional[float] = None
    
    def headers(self, headers: Dict[str, str]) -> "RequestBuilder":
        self._headers.update(headers)
        return self
    
    def query_params(self, params: Dict[str, Any]) -> "RequestBuilder":
        self._params.update(params)
        return self
    
    def json_body(self, data: Dict[str, Any]) -> "RequestBuilder":
        self._body = json.dumps(data)
        self._headers["Content-Type"] = "application/json"
        return self
    
    def form_data(self, data: Dict[str, Any]) -> "RequestBuilder":
        self._body = data
        self._headers["Content-Type"] = "application/x-www-form-urlencoded"
        return self
    
    def timeout(self, seconds: float) -> "RequestBuilder":
        self._timeout = seconds
        return self
    
    def build(self) -> Dict[str, Any]:
        return {
            "method": self.method.value,
            "url": self.url,
            "headers": self._headers,
            "params": self._params,
            "body": self._body,
            "timeout": self._timeout
        }

# Usage
request = (RequestBuilder(HTTPMethod.POST, "https://api.example.com/items")
    .headers({"Authorization": "Bearer token123"})
    .query_params({"include": "details"})
    .json_body({"name": "test", "value": 100})
    .timeout(10.0)
    .build())
\\\

### 3. Retry Strategy with Backoff

\\\python
import asyncio
from typing import Callable, TypeVar, Any
from functools import wraps

T = TypeVar('T')

class RetryStrategy:
    """Configurable retry strategy with exponential backoff"""
    
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        jitter: bool = True,
        retryable_status_codes: tuple = (429, 500, 502, 503, 504)
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff_factor = backoff_factor
        self.jitter = jitter
        self.retryable_status_codes = retryable_status_codes
    
    def calculate_delay(self, attempt: int) -> float:
        import random
        delay = min(self.base_delay * (self.backoff_factor ** attempt), self.max_delay)
        
        if self.jitter:
            # Add random jitter between 0-25%
            delay = delay * (1 + random.random() * 0.25)
        
        return delay
    
    def should_retry(self, response: Any) -> bool:
        if response is None:
            return True  # Network error
        if hasattr(response, 'status_code'):
            return response.status_code in self.retryable_status_codes
        return False

async def with_retry(client: httpx.AsyncClient, request: dict, strategy: RetryStrategy):
    last_exception = None
    
    for attempt in range(strategy.max_retries + 1):
        try:
            response = await client.request(
                method=request["method"],
                url=request["url"],
                headers=request.get("headers"),
                json=request.get("body")
            )
            
            if not strategy.should_retry(response):
                return response
            
            # Check for successful response
            if 200 <= response.status_code < 300:
                return response
                
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            last_exception = e
        
        if attempt < strategy.max_retries:
            delay = strategy.calculate_delay(attempt)
            await asyncio.sleep(delay)
    
    raise last_exception or Exception("Max retries exceeded")
\\\

### 4. Response Handling

\\\python
from dataclasses import dataclass
from typing import Optional, Any
import json
import time

@dataclass
class HTTPResponse:
    """Standardized HTTP response wrapper"""
    status_code: int
    headers: Dict[str, str]
    body: Any
    elapsed_ms: int
    request_url: str
    
    @property
    def is_success(self) -> bool:
        return 200 <= self.status_code < 300
    
    @property
    def is_client_error(self) -> bool:
        return 400 <= self.status_code < 500
    
    @property
    def is_server_error(self) -> bool:
        return 500 <= self.status_code < 600
    
    @property
    def is_rate_limited(self) -> bool:
        return self.status_code == 429
    
    def json(self) -> Any:
        if isinstance(self.body, str):
            return json.loads(self.body)
        return self.body

class ResponseParser:
    """Parse and validate HTTP responses"""
    
    @staticmethod
    def parse(response: httpx.Response, request_url: str) -> HTTPResponse:
        start_time = time.time()
        
        # Parse body based on content type
        content_type = response.headers.get("Content-Type", "")
        body = None
        
        if "application/json" in content_type:
            try:
                body = response.json()
            except json.JSONDecodeError:
                body = response.text
        elif "text/" in content_type:
            body = response.text
        else:
            body = response.content
        
        return HTTPResponse(
            status_code=response.status_code,
            headers=dict(response.headers),
            body=body,
            elapsed_ms=int((time.time() - start_time) * 1000),
            request_url=request_url
        )
\\\

### 5. Connection Pool Management

\\\python
class ConnectionPool:
    """Manage connection pools for multiple hosts"""
    
    def __init__(self, max_connections_per_host: int = 10):
        self.max_per_host = max_connections_per_host
        self._pools: Dict[str, httpx.AsyncClient] = {}
        self._lock = asyncio.Lock()
    
    async def get_client(self, base_url: str) -> httpx.AsyncClient:
        async with self._lock:
            if base_url not in self._pools:
                self._pools[base_url] = httpx.AsyncClient(
                    base_url=base_url,
                    limits=httpx.Limits(
                        max_keepalive_connections=self.max_per_host,
                        max_connections=self.max_per_host
                    ),
                    timeout=httpx.Timeout(30.0)
                )
            return self._pools[base_url]
    
    async def close_all(self):
        async with self._lock:
            for client in self._pools.values():
                await client.aclose()
            self._pools.clear()

# Global pool instance
_global_pool = ConnectionPool(max_connections_per_host=20)

async def get_client_for(url: str) -> httpx.AsyncClient:
    # Extract base URL
    from urllib.parse import urlparse
    base = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    return await _global_pool.get_client(base)
\\\

### 6. Authentication Patterns

\\\python
import base64

class AuthHandler:
    """Handle various authentication schemes"""
    
    @staticmethod
    def bearer_token(token: str) -> Dict[str, str]:
        return {"Authorization": f"Bearer {token}"}
    
    @staticmethod
    def basic_auth(username: str, password: str) -> str:
        credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
        return f"Basic {credentials}"
    
    @staticmethod
    def api_key(key: str, header_name: str = "X-API-Key") -> Dict[str, str]:
        return {header_name: key}
    
    @staticmethod
    def aws_signature(
        method: str,
        path: str,
        access_key: str,
        secret_key: str,
        region: str,
        service: str
    ) -> Dict[str, str]:
        # AWS Signature Version 4 implementation
        import hmac
        import hashlib
        from datetime import datetime
        
        now = datetime.utcnow()
        date = now.strftime("%Y%m%dT%H%M%SZ")
        dateStamp = now.strftime("%Y%m%d")
        
        # Simplified - full implementation would be more complex
        headers = {
            "X-Amz-Date": date,
            "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD"
        }
        
        return headers

# OAuth 2.0 Token Refresh
class OAuth2Handler:
    """Handle OAuth 2.0 with token refresh"""
    
    def __init__(self, client_id: str, client_secret: str, token_url: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = token_url
        self._access_token: Optional[str] = None
        self._expires_at: Optional[float] = None
    
    async def get_token(self, refresh_token: str = None, scope: str = None) -> str:
        # Check if current token is still valid
        if self._access_token and self._expires_at:
            if time.time() < self._expires_at - 60:  # Refresh 60s before expiry
                return self._access_token
        
        # Refresh or obtain new token
        data = {
            "grant_type": "refresh_token" if refresh_token else "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        if refresh_token:
            data["refresh_token"] = refresh_token
        if scope:
            data["scope"] = scope
        
        # Make request to token endpoint
        response = await httpx.AsyncClient().post(self.token_url, data=data)
        token_data = response.json()
        
        self._access_token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 3600)
        self._expires_at = time.time() + expires_in
        
        return self._access_token
\\\

## MCP Integration Example

### Make Your Own MCP (curl-based)
\\\python
# MCP server: /server/make-your-own
# Simple web fetching using curl via MCP

from make_your_own import FetchClient

client = FetchClient()

# Simple GET request
result = await client.fetch("https://api.example.com/data")
print(result)

# POST with JSON body
result = await client.fetch(
    "https://api.example.com/users",
    method="POST",
    json={"name": "John", "email": "john@example.com"},
    headers={"Authorization": "Bearer token"}
)
\\\

### Fetcher MCP (Playwright-based)
\\\python
# MCP server: /server/fetcher-1
# Fetch web page content with JavaScript execution

from fetcher import FetcherClient

client = FetcherClient()

# Fetch and extract content
result = await client.fetch(
    url="https://example.com/dynamic-page",
    wait_for="#content-loaded",  # Wait for selector
    extract="text",  # Extract as text
    timeout=30000
)

# Extract specific elements
result = await client.fetch(
    url="https://example.com/products",
    selectors=[".product-name", ".product-price"],
    format="json"
)
\\\

## Error Handling Patterns

### Typed HTTP Errors
\\\python
from typing import Optional
from enum import Enum

class HTTPErrorType(Enum):
    TIMEOUT = "timeout"
    CONNECTION = "connection"
    SSL = "ssl_error"
    AUTH = "authentication_error"
    RATE_LIMIT = "rate_limit"
    CLIENT_ERROR = "client_error"
    SERVER_ERROR = "server_error"
    UNKNOWN = "unknown"

class HTTPError(Exception):
    """Typed HTTP error with context"""
    
    def __init__(
        self,
        error_type: HTTPErrorType,
        message: str,
        status_code: Optional[int] = None,
        response_body: Optional[str] = None,
        retry_after: Optional[int] = None
    ):
        self.error_type = error_type
        self.message = message
        self.status_code = status_code
        self.response_body = response_body
        self.retry_after = retry_after
        super().__init__(self.message)

def handle_response_error(response: httpx.Response) -> HTTPError:
    """Convert HTTP response to typed error"""
    
    if response.status_code == 401:
        return HTTPError(
            error_type=HTTPErrorType.AUTH,
            message="Authentication failed",
            status_code=401
        )
    elif response.status_code == 429:
        retry_after = int(response.headers.get("Retry-After", 60))
        return HTTPError(
            error_type=HTTPErrorType.RATE_LIMIT,
            message="Rate limit exceeded",
            status_code=429,
            retry_after=retry_after
        )
    elif 400 <= response.status_code < 500:
        return HTTPError(
            error_type=HTTPErrorType.CLIENT_ERROR,
            message=f"Client error: {response.status_code}",
            status_code=response.status_code,
            response_body=response.text
        )
    elif 500 <= response.status_code < 600:
        return HTTPError(
            error_type=HTTPErrorType.SERVER_ERROR,
            message=f"Server error: {response.status_code}",
            status_code=response.status_code,
            response_body=response.text
        )
    
    return HTTPError(
        error_type=HTTPErrorType.UNKNOWN,
        message=f"Unexpected error: {response.status_code}",
        status_code=response.status_code
    )
\\\

## Monitoring and Observability

\\\python
import logging
from typing import Optional

class HTTPClientMetrics:
    """Track HTTP client metrics"""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger("http_metrics")
        self.total_requests = 0
        self.total_errors = 0
        self.total_retries = 0
        self.total_time_ms = 0
    
    def record_request(self, method: str, url: str, status: int, duration_ms: int):
        self.total_requests += 1
        self.total_time_ms += duration_ms
        
        if status >= 400:
            self.total_errors += 1
        
        self.logger.info(
            f"HTTP {method} {url} -> {status} ({duration_ms}ms)"
        )
    
    def record_retry(self, attempt: int, url: str):
        self.total_retries += 1
        self.logger.warning(f"Retry {attempt} for {url}")
    
    def get_stats(self) -> dict:
        return {
            "total_requests": self.total_requests,
            "total_errors": self.total_errors,
            "error_rate": self.total_errors / max(self.total_requests, 1),
            "total_retries": self.total_retries,
            "avg_response_time_ms": self.total_time_ms / max(self.total_requests, 1)
        }
\\\

## Best Practices Summary

1. **Use connection pooling** - Reuse connections for better performance
2. **Implement proper timeouts** - Set connection and read timeouts
3. **Handle retries with backoff** - Use exponential backoff with jitter
4. **Centralize authentication** - Use auth handlers consistently
5. **Log everything** - Track requests, responses, and errors
6. **Validate responses** - Check status codes and parse body
7. **Handle rate limits** - Respect Retry-After headers
8. **Monitor metrics** - Track latency, errors, and retry rates
9. **Use async when appropriate** - Use asyncio for I/O-bound operations
10. **Clean up resources** - Always close clients and connections
