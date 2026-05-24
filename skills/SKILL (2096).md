---
name: api-integration-patterns
description: Architectural patterns and best practices for integrating with external APIs.
origin: MCP Market
---

# API Integration Patterns

## Overview

This skill provides architectural patterns and best practices for integrating with external APIs, based on patterns from MCP market tools like SerpApi, Serper, GPT Researcher, and various service integrations.

## Key Patterns

### 1. Service Abstraction Layer

Create a unified interface for external services:

\\\python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import logging

class BaseAPIClient(ABC):
    \"\"\"Abstract base class for API clients\"\"\"
    
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        \"\"\"Implement actual HTTP request logic\"\"\"
        pass
    
    @abstractmethod
    def parse_response(self, response: Any) -> Dict:
        \"\"\"Parse API-specific response format\"\"\"
        pass

class SearchAPIClient(BaseAPIClient):
    \"\"\"Generic search API client\"\"\"
    
    def __init__(self, provider: str, api_key: str):
        self.provider = provider
        providers = {
            \"serpapi\": \"https://serpapi.com\",
            \"serper\": \"https://google.serper.dev\",
            \"ddg\": \"https://duckduckgo.com\"
        }
        super().__init__(api_key, providers.get(provider, \"\"))
    
    def search(self, query: str, num_results: int = 10) -> Dict:
        endpoint = \"/search\" if self.provider == \"serpapi\" else \"/search\"
        return self._make_request(\"GET\", endpoint, params={
            \"q\": query,
            \"num\": num_results
        })
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        headers = {
            \"X-API-KEY\": self.api_key,
            \"Content-Type\": \"application/json\"
        }
        # Implementation with proper error handling
        return {\"results\": [], \"status\": \"success\"}
    
    def parse_response(self, response: Any) -> Dict:
        # Provider-specific parsing
        return {\"items\": [], \"total\": 0}
\\\

### 2. Configuration-Driven Integration

\\\python
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class APIConfig:
    \"\"\"Configuration for API integration\"\"\"
    name: str
    base_url: str
    auth_type: str  # 'bearer', 'api_key', 'basic', 'oauth'
    auth_credentials: Dict[str, str]
    rate_limit: int  # requests per minute
    timeout: int  # seconds
    retry_config: Dict[str, int]
    headers: Dict[str, str]

# Configuration registry
API_REGISTRY: Dict[str, APIConfig] = {
    \"serpapi\": APIConfig(
        name=\"SerpApi\",
        base_url=\"https://serpapi.com\",
        auth_type=\"api_key\",
        auth_credentials={\"api_key\": \"\"},
        rate_limit=100,
        timeout=30,
        retry_config={\"max_retries\": 3, \"backoff_factor\": 2},
        headers={}
    ),
    \"serper\": APIConfig(
        name=\"Serper\",
        base_url=\"https://google.serper.dev\",
        auth_type=\"bearer\",
        auth_credentials={\"x-api-key\": \"\"},
        rate_limit=50,
        timeout=30,
        retry_config={\"max_retries\": 2, \"backoff_factor\": 1.5},
        headers={\"Content-Type\": \"application/json\"}
    )
}

def get_client(config_name: str) -> BaseAPIClient:
    \"\"\"Factory function to get appropriate client\"\"\"
    config = API_REGISTRY.get(config_name)
    if not config:
        raise ValueError(f\"Unknown API config: {config_name}\")
    # Return appropriate client based on config
    return SearchAPIClient(config_name, config.auth_credentials.get(\"api_key\", \"\"))
\\\

### 3. Circuit Breaker Pattern

\\\python
import time
import threading
from enum import Enum
from typing import Callable, Any

class CircuitState(Enum):
    CLOSED = \"closed\"
    OPEN = \"open\"
    HALF_OPEN = \"half_open\"

class CircuitBreaker:
    \"\"\"Circuit breaker for API calls\"\"\"
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
        self._lock = threading.Lock()
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        with self._lock:
            if self.state == CircuitState.OPEN:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitState.HALF_OPEN
                    self.logger.info(\"Circuit transitioning to HALF_OPEN\")
                else:
                    raise Exception(\"Circuit is OPEN\")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        with self._lock:
            self.failure_count = 0
            self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                self.logger.warning(\"Circuit OPENED due to failures\")

# Usage
circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)

def call_external_api():
    return circuit_breaker.call(api_client.search, \"query\")
\\\

### 4. Request/Response Transformation

\\\python
from dataclasses import dataclass, field
from typing import Any, Dict, List
import json

@dataclass
class APIRequest:
    \"\"\"Standardized request format\"\"\"
    endpoint: str
    method: str = \"GET\"
    params: Dict[str, Any] = field(default_factory=dict)
    headers: Dict[str, Any] = field(default_factory=dict)
    body: Dict[str, Any] = field(default_factory=dict)
    timeout: int = 30

@dataclass  
class APIResponse:
    \"\"\"Standardized response format\"\"\"
    status_code: int
    data: Any
    headers: Dict[str, str] = field(default_factory=dict)
    error: str = None
    duration_ms: int = 0

class RequestTransformer:
    \"\"\"Transform external API formats to internal format\"\"\"
    
    @staticmethod
    def transform_response(api_name: str, raw_response: Dict) -> APIResponse:
        transformers = {
            \"serpapi\": SerpAPIResponseTransformer.transform,
            \"serper\": SerperResponseTransformer.transform,
            \"newsapi\": NewsAPIResponseTransformer.transform
        }
        
        transformer = transformers.get(api_name)
        if not transformer:
            return APIResponse(status_code=200, data=raw_response)
        
        return transformer(raw_response)

class SerpAPIResponseTransformer:
    @staticmethod
    def transform(response: Dict) -> APIResponse:
        results = []
        if \"organic_results\" in response:
            for item in response[\"organic_results\"]:
                results.append({
                    \"title\": item.get(\"title\"),
                    \"link\": item.get(\"link\"),
                    \"snippet\": item.get(\"snippet\"),
                    \"position\": item.get(\"position\")
                })
        
        return APIResponse(
            status_code=response.get(\"search_metadata\", {}).get(\"status\", 200),
            data={\"results\": results, \"total\": len(results)},
            duration_ms=response.get(\"search_metadata\", {}).get(\"total_time\", 0)
        )
\\\

### 5. Batch Processing Pattern

\\\python
import asyncio
from typing import List, Callable, Any
from dataclasses import dataclass

@dataclass
class BatchConfig:
    \"\"\"Configuration for batch API operations\"\"\"
    batch_size: int = 10
    max_concurrent: int = 5
    delay_between_batches: float = 1.0

class BatchProcessor:
    \"\"\"Process items in batches with concurrency control\"\"\"
    
    def __init__(self, config: BatchConfig):
        self.config = config
        self.semaphore = asyncio.Semaphore(config.max_concurrent)
    
    async def process_batch(
        self,
        items: List[Any],
        process_func: Callable,
        transform_input: Callable = None
    ) -> List[Any]:
        results = []
        
        for i in range(0, len(items), self.config.batch_size):
            batch = items[i:i + self.config.batch_size]
            
            tasks = []
            for item in batch:
                item_to_process = transform_input(item) if transform_input else item
                tasks.append(self._process_item(process_func, item_to_process))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            results.extend(self._handle_batch_results(batch_results))
            
            if i + self.config.batch_size < len(items):
                await asyncio.sleep(self.config.delay_between_batches)
        
        return results
    
    async def _process_item(self, func: Callable, item: Any) -> Any:
        async with self.semaphore:
            return await func(item)
    
    def _handle_batch_results(self, results: List[Any]) -> List[Any]:
        processed = []
        for result in results:
            if isinstance(result, Exception):
                processed.append({\"error\": str(result), \"success\": False})
            else:
                processed.append(result)
        return processed

# Usage
async def fetch_news_item(item: Dict) -> Dict:
    # Fetch single news item
    return {\"title\": item[\"title\"], \"content\": \"fetched content\"}

processor = BatchProcessor(BatchConfig(batch_size=5, max_concurrent=3))
all_news = await processor.process_batch(
    news_items,
    fetch_news_item,
    lambda x: {\"id\": x[\"id\"], \"title\": x[\"title\"]}
)
\\\

## MCP Integration Examples

### Serper Search and Scrape MCP
\\\python
# MCP server: /server/serper-search-and-scrape

from serper_mcp import SerperClient

client = SerperClient(api_key=\"your-key\")

# Web search
search_results = client.search(
    query=\"artificial intelligence trends 2024\",
    num=10
)

# Webpage scrape
page_content = client.scrape(
    url=\"https://example.com/article\",
    extract_text=True
)
\\\

### SerpApi Integration
\\\python
# MCP server: /server/serpapi

from serpapi import SerpAPI

client = SerpAPI(api_key=\"your-key\")

# Google search
results = client.search(
    engine=\"google\",
    q=\"machine learning\",
    num=20,
    location=\"United States\"
)
\\\

## Error Handling Strategies

### Graceful Degradation
\\\python
class APIClientWithFallback:
    def __init__(self):
        self.primary_client = PrimaryAPI()
        self.fallback_client = FallbackAPI()
    
    def fetch_data(self, query: str):
        try:
            return self.primary_client.search(query)
        except RateLimitError:
            self.logger.warning(\"Primary API rate limited, using fallback\")
            return self.fallback_client.search(query)
        except ServiceUnavailableError:
            self.logger.error(\"Both APIs unavailable, returning cached data\")
            return self.get_cached_data(query)
\\\

### Typed Error Handling
\\\python
from enum import Enum

class APIErrorType(Enum):
    RATE_LIMIT = \"rate_limit\"
    AUTH = \"authentication\"
    NOT_FOUND = \"not_found\"
    SERVER_ERROR = \"server_error\"
    TIMEOUT = \"timeout\"
    UNKNOWN = \"unknown\"

@dataclass
class APIError:
    error_type: APIErrorType
    message: str
    status_code: int
    retryable: bool

def handle_api_error(e: Exception) -> APIError:
    # Map exception to typed error
    if isinstance(e, RateLimitException):
        return APIError(
            error_type=APIErrorType.RATE_LIMIT,
            message=str(e),
            status_code=429,
            retryable=True
        )
    # ... more mappings
\\\

## Best Practices Summary

1. **Always use abstraction layers** - Hide API specifics behind interfaces
2. **Implement circuit breakers** - Prevent cascade failures
3. **Cache intelligently** - Store responses when appropriate
4. **Handle rate limits** - Implement proper backoff strategies
5. **Transform responses** - Normalize data before internal use
6. **Log everything** - Track API calls, errors, and performance
7. **Use typed interfaces** - Define clear request/response contracts
8. **Test failures** - Verify error handling works correctly
