---
name: content-management-system
description: Use this skill when managing digital content, creating or updating web pages, handling media libraries, or automating content workflows for websites and blogs. Provides patterns for CMS integration.
origin: MCP Market E-commerce Category
---

# Content Management System Skill

Manage digital content operations using CMS platform APIs and MCP servers.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Claudeus WordPress | 140+ servers | Content creation, SEO |
| Bricks Builder | 81+ servers | Site design automation |
| Wenyan | 1.2k+ servers | WeChat articles |
| Md2Wechat | 2.1k+ servers | Markdown to WeChat |

## When to Activate

- Creating and publishing content
- Managing media libraries
- Automating content workflows
- Updating website pages
- Handling multilingual content
- SEO optimization tasks

## Key Patterns

### 1. Content Publishing Workflow
\\\python
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class ContentItem:
    title: str
    body: str
    slug: str
    status: str = "draft"
    categories: List[str] = None
    featured_image: str = None
    author_id: str = None
    
    async def publish(self, cms_client):
        if not self.validate():
            raise ContentValidationError()
        
        return await cms_client.create_post({
            "title": self.title,
            "content": self.body,
            "status": "publish",
            "slug": self.slug,
            "categories": self.categories,
            "featured_media": self.featured_image
        })
    
    def validate(self) -> bool:
        return bool(self.title and self.body and self.slug)

class EditorialWorkflow:
    async def submit_for_review(self, content: ContentItem):
        content.status = "pending_review"
        await content.save()
        await notify_reviewers(content)
    
    async def approve_and_publish(self, content: ContentItem, reviewer_id: str):
        content.status = "approved"
        content.reviewed_by = reviewer_id
        await content.publish()
        await update_content_calendar(content)
\\\

### 2. Media Library Management
\\\python
async def upload_and_optimize_media(file_path: str, alt_text: str, categories: List[str] = None):
    # Upload original
    media = await cms_client.upload_media(file_path)
    
    # Generate responsive sizes
    sizes = await generate_image_variants(file_path, [320, 640, 1024, 1920])
    
    # Optimize and upload variants
    for size_name, optimized in sizes.items():
        await cms_client.upload_media(optimized, parent_id=media.id)
    
    # Update metadata
    await cms_client.update_media(media.id, {
        "alt_text": alt_text,
        "categories": categories
    })
    
    return media
\\\

### 3. Headless CMS Content Delivery
\\\python
class HeadlessCMSClient:
    def __init__(self, api_key: str, space_id: str):
        self.base_url = f"https://cdn.contentful.com/spaces/{space_id}"
        self.headers = {"Authorization": f"Bearer {api_key}"}
    
    async def get_page(self, slug: str, locale: str = "en-US"):
        params = {
            "content_type": "page",
            "fields.slug": slug,
            "locale": locale,
            "include": 2  # Include linked entries
        }
        return await self.get("entries", params)
    
    async def get_blog_posts(self, limit: int = 10, category: str = None):
        params = {
            "content_type": "blogPost",
            "limit": limit,
            "order": "-fields.publishedDate",
            "include": 1
        }
        if category:
            params["fields.category"] = category
        
        return await self.get("entries", params)
\\\

### 4. Multilingual Content Sync
\\\python
async def translate_and_publish(content_id: str, target_locales: List[str], translator):
    source = await cms_client.get_content(content_id)
    
    tasks = []
    for locale in target_locales:
        if not await has_translation(content_id, locale):
            translated = await translator.translate(
                text=source.body,
                source="en",
                target=locale
            )
            tasks.append(create_translation(content_id, locale, translated))
    
    translations = await asyncio.gather(*tasks)
    
    for locale, translated in zip(target_locales, translations):
        await publish_translation(content_id, locale, translated)
\\\

## Best Practices

1. **Use staging environments** before publishing
2. **Implement content validation** before publishing
3. **Use proper cache invalidation** on updates
4. **Maintain revision history** for rollback
5. **Optimize media** before uploading
6. **Use webhooks** for real-time updates
7. **Implement proper permissions** and roles

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| ContentNotFound | Invalid slug | Check content ID/slug |
| MediaUploadFailed | File too large | Compress or resize |
| TranslationError | API timeout | Retry with backoff |
| PublishConflict | Concurrent edit | Merge or overwrite |
