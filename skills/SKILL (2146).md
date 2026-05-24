---
name: web-scraping-best-practices
description: Build robust, ethical, and efficient web scrapers using patterns from leading MCP market tools.
origin: MCP Market
---

# Web Scraping Best Practices

## Overview

This skill provides comprehensive guidance for building robust, ethical, and efficient web scrapers. Based on patterns from leading MCP market tools like Firecrawl, Browserbase, Crawl4AI, Trafilatura, and Bright Data.

## Key Concepts

### 1. Respectful Scraping
- Always check obots.txt before scraping
- Implement rate limiting (recommended: 1-2 seconds between requests)
- Use proper User-Agent headers
- Honor X-Robots-Tag and meta robots directives

### 2. Extraction Strategies

**Static Content Extraction:**
- Use tools like Trafilatura for HTML parsing
- Handle malformed HTML gracefully
- Extract semantic content (article body, product details)

**Dynamic Content (JavaScript-rendered):**
- Use Playwright/Puppeteer for headless browser extraction
- Wait for dynamic content to load before extraction
- Handle infinite scroll and lazy-loaded content

### 3. Data Quality
- Validate extracted data against known schemas
- Implement fallback extraction strategies
- Handle encoding issues (UTF-8, ISO-8859-1)
- Clean and normalize extracted text

### 4. Anti-Detection Patterns
- Rotate User-Agent strings
- Use residential proxies for sensitive targets
- Implement human-like behavior (random delays, natural scroll patterns)
- Handle CAPTCHAs appropriately (avoid when possible)

## MCP Tools Integration

### Recommended MCP Servers
- **Firecrawl** (/server/firecrawl) - AI-powered web scraping with extraction
- **Browserbase** (/server/browserbase) - Cloud browser infrastructure
- **Crawl4AI** (/server/crawl4ai-rag) - Open source crawling with RAG support
- **Bright Data** (/server/bright-data-2) - Web data with bypass capabilities
- **Trafilatura** (/server/trafilatura) - Text and metadata extraction

### Example: Using Firecrawl via MCP

\\\python
# MCP server: Firecrawl
# Endpoint: /server/firecrawl

from firecrawl import FirecrawlClient

client = FirecrawlClient(api_key=\"your-key\")

# Extract structured data from URL
result = client.extract_url(
    url=\"https://example.com/products\",
    prompt=\"Extract all product names, prices, and descriptions\"
)

print(result.data)
\\\

### Example: Browserbase Cloud Browser

\\\python
# MCP server: Browserbase
# Endpoint: /server/browserbase

from browserbase import Browserbase

bb = Browserbase(api_key=\"your-key\")

# Create browser session for dynamic content
session = bb.create_session(
    project_id=\"your-project\",
    browser=\"chrome\"
)

# Navigate and extract
page = session.navigate(\"https://dynamic-site.com\")
content = page.extract(\"all product cards\")
\\\

## Error Handling Patterns

### Retry Strategy
\\\python
import time
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (TimeoutError, ConnectionError) as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry_with_backoff(max_retries=3)
def fetch_page(url):
    # scraping logic
    pass
\\\

### Circuit Breaker Pattern
\\\python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = \"closed\"
    
    def call(self, func):
        if self.state == \"open\":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = \"half-open\"
            else:
                raise Exception(\"Circuit open\")
        
        try:
            result = func()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        self.failures = 0
        self.state = \"closed\"
    
    def _on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = \"open\"
\\\

## Pagination Patterns

### Sequential Pagination
\\\python
async def scrape_with_pagination(base_url, max_pages=10):
    results = []
    for page in range(1, max_pages + 1):
        url = f\"{base_url}?page={page}\"
        content = await fetch_with_retry(url)
        items = extract_items(content)
        results.extend(items)
        
        if not has_next_page(content):
            break
        
        await rate_limit_delay()  # 1-2 second delay
    
    return results
\\\

### Cursor-Based Pagination
\\\python
async def scrape_cursor_pagination(initial_url):
    results = []
    cursor = None
    url = initial_url
    
    while True:
        params = {\"cursor\": cursor} if cursor else {}
        response = await api_call(url, params=params)
        
        results.extend(response[\"items\"])
        cursor = response.get(\"next_cursor\")
        
        if not cursor:
            break
        
        await rate_limit_delay()
    
    return results
\\\

## Structured Data Extraction

### Using CSS Selectors
\\\python
from bs4 import BeautifulSoup

def extract_product_details(html):
    soup = BeautifulSoup(html, \"html.parser\")
    
    return {
        \"name\": soup.select_one(\".product-title\").text.strip(),
        \"price\": soup.select_one(\".product-price\").text.strip(),
        \"description\": soup.select_one(\".product-description\").text.strip(),
        \"images\": [img[\"src\"] for img in soup.select(\".product-image\")],
        \"availability\": soup.select_one(\".stock-status\").text.strip()
    }
\\\

### Using XPath
\\\python
from lxml import etree

def extract_with_xpath(html):
    tree = etree.HTML(html)
    
    return {
        \"title\": tree.xpath(\"//h1[@class='title']/text()\")[0],
        \"price\": tree.xpath(\"//span[@class='price']/text()\")[0],
        \"reviews\": [
            {
                \"user\": review.xpath(\".//span[@class='user']/text()\")[0],
                \"rating\": review.xpath(\".//span[@class='rating']/text()\")[0],
                \"text\": review.xpath(\".//p[@class='comment']/text()\")[0]
            }
            for review in tree.xpath(\"//div[@class='review']\")
        ]
    }
\\\

## Best Practices Summary

1. **Start Simple**: Use HTTP requests first, only escalate to browsers when needed
2. **Check for APIs**: Many sites have undocumented APIs that are easier to use
3. **Cache Responsibly**: Store fetched content to avoid redundant requests
4. **Handle Errors Gracefully**: Implement proper error handling and logging
5. **Test Incrementally**: Verify extraction works on small samples before scaling
6. **Monitor Performance**: Track request times, success rates, and data quality
7. **Stay Legal**: Understand and comply with applicable laws (CFAA, GDPR, etc.)
