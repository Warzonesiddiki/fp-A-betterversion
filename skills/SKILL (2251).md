---
name: social-media-automation
description: Use this skill when automating social media posts, analyzing engagement metrics, managing multiple platform accounts, or creating and scheduling content across platforms. Provides MCP server patterns.
origin: MCP Market Social Media Category
---

# Social Media Automation Skill

Automate social media operations across multiple platforms using MCP servers and platform APIs.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| Agent Twitter Client | 1.7k+ servers | Automated posting, scraping |
| WhatsApp | 5.6k+ servers | Messaging automation |
| Xiaohongshu | 14k+ servers | Content publishing |
| YouTube | 515+ servers | Video/channel management |
| LinkedIn Scraper | 1.9k+ servers | Profile and job data |
| Twitter/X | 391+ servers | Posting and search |
| Discord | 306+ servers | Bot integration |
| Telegram | Multiple | Chat automation |
| Meta Ads | 890+ servers | Ad management |
| Reddit Buddy | 645+ servers | Content browsing |
| Short Video Maker | 1.1k+ servers | TikTok/Reels automation |
| LINE Bot | 577+ servers | LINE messaging |
| Atproto/Bluesky | 653+ servers | Fediverse integration |
| Douyin | 991+ servers | Video extraction |
| Md2Wechat | 2.1k+ servers | WeChat publishing |
| Wenyan | 1.2k+ servers | WeChat articles |

## When to Activate

- Scheduling and publishing content
- Analyzing engagement metrics
- Managing multiple platform accounts
- Automating responses and interactions
- Creating short-form videos
- Monitoring brand mentions and sentiment

## MCP Configuration Example

\\\json
{
  "mcpServers": {
    "twitter": {
      "command": "uvx",
      "args": ["mcp-twitter-agent"],
      "env": {
        "TWITTER_USERNAME": "...",
        "TWITTER_PASSWORD": "..."
      }
    },
    "youtube": {
      "command": "uvx",
      "args": ["mcp-youtube"],
      "env": {"YOUTUBE_API_KEY": "..."}
    }
  }
}
\\\

## Key Patterns

### 1. Cross-Platform Content Scheduling
\\\python
from dataclasses import dataclass
from typing import List, Dict
from datetime import datetime

@dataclass
class ScheduledPost:
    content: str
    platforms: List[str]
    scheduled_time: datetime
    media_urls: List[str] = None
    
    def adapt_for_platform(self, platform: str) -> Dict:
        adaptations = {
            "twitter": lambda: {"text": self.content[:280], "media": self.media_urls},
            "instagram": lambda: {"caption": self.content, "media": self.media_urls},
            "linkedin": lambda: {"text": self.content, "media": self.media_urls}
        }
        return adaptations.get(platform, lambda: {"text": self.content})()

async def schedule_post(post: ScheduledPost):
    for platform in post.platforms:
        adapted = post.adapt_for_platform(platform)
        await get_client(platform).schedule(adapted, post.scheduled_time)
\\\

### 2. Engagement Analytics Aggregation
\\\python
async def get_engagement_metrics(accounts: List[SocialAccount], start_date: date, end_date: date):
    tasks = []
    for account in accounts:
        tasks.append(fetch_platform_metrics(account, start_date, end_date))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    aggregated = {
        "total_posts": sum(r["posts"] for r in results if not isinstance(r, Exception)),
        "total_engagement": sum(r["engagement"] for r in results),
        "total_reach": sum(r["reach"] for r in results),
        "avg_engagement_rate": calculate_avg_rate(results)
    }
    
    return aggregated
\\\

### 3. Automated Response Pattern
\\\python
class AutoResponseHandler:
    def __init__(self):
        self.rules = [
            (mentions_brand(), respond_greeting),
            (common_question(), respond_faq),
            (support_request(), escalate_to_human)
        ]
    
    async def handle_mention(self, mention: Mention):
        for matcher, handler in self.rules:
            if matcher(mention):
                response = await handler(mention)
                if response:
                    await post_response(mention, response)
                break
\\\

### 4. Short Video Creation
\\\python
async def create_short_video(script: str, style: str = "default", platforms: List[str] = None):
    platforms = platforms or ["tiktok", "instagram", "youtube"]
    
    video = await video_generator.create(
        script=script,
        style=style,
        duration=60,  # Max for short-form
        vertical=True
    )
    
    results = {}
    for platform in platforms:
        formatted = video.format_for(platform)
        results[platform] = await upload_to_platform(platform, formatted)
    
    return results
\\\

## Best Practices

1. **Respect rate limits** across all platforms
2. **Use OAuth 2.0** for secure authentication
3. **Adapt content** for each platform format
4. **Implement webhooks** for real-time notifications
5. **Use idempotent operations** for publishing
6. **Monitor for compliance** issues
7. **Log all activities** for audit

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| RateLimitExceeded | API quota hit | Use exponential backoff |
| ContentFlagged | Policy violation | Review content guidelines |
| AuthExpired | Token expired | Refresh OAuth token |
| PlatformDown | Service outage | Retry with circuit breaker |
