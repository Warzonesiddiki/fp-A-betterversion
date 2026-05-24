---
name: python-web-scraping-beautifulsoup
description: Extracting data from websites using BeautifulSoup and related tools
origin: ECC
---

# Python Web Scraping with BeautifulSoup Skill

Use this skill for extracting data from websites using BeautifulSoup and related tools.

## Setup
```bash
pip install beautifulsoup4 requests lxml html5lib selenium playwright
pip install scrapy
pip install httpx aiohttp
```

## Basic Usage

### Simple Request
```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com"
response = requests.get(url)
soup = BeautifulSoup(response.content, "html.parser")

title = soup.title.string
headings = soup.find_all("h1")
links = soup.find_all("a", href=True)
images = soup.find_all("img")
```

### Parsing Options
```python
soup = BeautifulSoup(content, "html.parser")
soup = BeautifulSoup(content, "lxml")
soup = BeautifulSoup(content, "html5lib")
soup = BeautifulSoup(content, "xml")
```

## Navigation

### Going Down (Finding Tags)
```python
soup.find("div")
soup.find("div", class_="content")
soup.find("div", id="main")
soup.find("div", attrs={"data-id": "123"})

soup.find_all("p")
soup.find_all("p", class_="text")
soup.find_all("a", href=lambda x: x and "example" in x)

soup.find("div", recursive=False)
```

### CSS Selectors
```python
soup.select("div")
soup.select(".class-name")
soup.select("#element-id")
soup.select("div.class-name")
soup.select("div > p")
soup.select("div p")
soup.select("div + p")
soup.select("a[href]")

soup.select_one("div")
soup.select_first("div")

soup.select("div, p, span")
soup.select("a[href^='https']")
soup.select("a[href$='.pdf']")
soup.select("a[href*='example']")
```

### Going Up (Parent Elements)
```python
tag.parent
tag.parents
tag.find_parent("div")
tag.find_parents("div")
```

### Going Sideways (Siblings)
```python
tag.next_sibling
tag.previous_sibling
tag.next_siblings
tag.previous_siblings
tag.find_next_sibling("p")
tag.find_previous_sibling("p")
```

### Going Back and Forth (Contents)
```python
tag.next_element
tag.previous_element
tag.next_elements
tag.previous_elements
```

## Extracting Content

### Text
```python
tag.get_text()
tag.get_text(separator="\n")
tag.get_text(separator="\n", strip=True)
tag.get_text(separator="", strip=True)
```

### Attributes
```python
tag["href"]
tag.get("href")
tag.get("href", "default")

for link in soup.find_all("a"):
    print(link.get("href"))
    print(link.get("title"))
```

### Strings
```python
tag.string
tag.strings
tag.stripped_strings
```

## Handling Common Patterns

### Tables
```python
table = soup.find("table")
rows = table.find_all("tr")

data = []
for row in rows:
    cols = row.find_all(["td", "th"])
    data.append([col.get_text(strip=True) for col in cols])
```

### Lists
```python
items = soup.select("ul > li")
for item in items:
    print(item.get_text(strip=True))
```

### Nested Elements
```python
articles = soup.select("div.article")
for article in articles:
    title = article.select_one("h2.title")
    content = article.select_one("div.content")
    author = article.select_one("span.author")
```

### Pagination
```python
def scrape_all_pages(base_url):
    page = 1
    while True:
        url = f"{base_url}?page={page}"
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        
        items = soup.select("div.item")
        if not items:
            break
        
        for item in items:
            yield extract_item(item)
        
        page += 1
```

## Working with Forms
```python
form = soup.find("form")
action = form.get("action")
method = form.get("method", "get")

inputs = {}
for input_tag in form.find_all("input"):
    name = input_tag.get("name")
    value = input_tag.get("value", "")
    inputs[name] = value

data = {"username": "user", "password": "pass"}
response = requests.post(form.get("action"), data=data)
```

## Headers & Sessions
```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

session = requests.Session()
session.headers.update(headers)

response = session.get(url)
```

## Handling JavaScript

### Selenium
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument("--headless")

driver = webdriver.Chrome(options=options)
driver.get(url)

WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "div.content"))
)

soup = BeautifulSoup(driver.page_source, "html.parser")
driver.quit()
```

### Playwright
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url)
    page.wait_for_selector("div.content")
    content = page.content()
    browser.close()
```

### HTTPX (Async)
```python
import httpx
import asyncio
from bs4 import BeautifulSoup

async def fetch_all(urls):
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [BeautifulSoup(r.text, "html.parser") for r in responses]
```

## Caching
```python
import requests_cache

requests_cache.install_cache("demo_cache", expire_after=3600)

response = requests.get(url)
if response.from_cache:
    print("Using cached response")
```

## Data Storage
```python
import csv

with open("output.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["title", "price", "url"])
    writer.writeheader()
    
    for item in items:
        writer.writerow({
            "title": item["title"],
            "price": item["price"],
            "url": item["url"]
        })
```

```python
import json

with open("output.json", "w") as f:
    json.dump(data, f, indent=2)
```

## Rate Limiting
```python
import time
import random

for url in urls:
    delay = random.uniform(1, 3)
    time.sleep(delay)
    
    response = requests.get(url)
    # process response
```

### Tenacity for Retry
```python
from tenacity import retry, stop_after_attempt, wait_fixed

@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
def fetch_with_retry(url):
    return requests.get(url)
```

## Cleaning Text
```python
import re

def clean_text(text):
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    text = re.sub(r"[\$\€\£]", "", text)
    return text

clean_text(tag.get_text(separator=" ", strip=True))
```

## Logging & Error Handling
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_request(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response
    except requests.RequestException as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None
```

## Best Practices
- Always respect robots.txt
- Add delays between requests
- Use sessions for cookies
- Rotate User-Agent headers
- Check response status codes
- Handle missing elements gracefully
- Cache responses when possible
- Use proper error handling
- Be mindful of server load
- Consider using APIs instead of scraping

## Legal Considerations
- Check terms of service
- Use public data when possible
- Add identifying User-Agent
- Rate limit requests
- Store only necessary data
