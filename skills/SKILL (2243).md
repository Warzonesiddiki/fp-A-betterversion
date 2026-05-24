---
name: crm-integration-patterns
description: Use this skill when integrating CRM systems, managing customer relationships, automating sales pipelines, or syncing customer data across platforms. Provides patterns for CRM integration.
origin: MCP Market E-commerce Category
---

# CRM Integration Patterns Skill

Integrate CRM systems for customer relationship management using MCP servers and REST APIs.

## MCP Servers from MCP Market

| Server | Description | Use Case |
|--------|-------------|----------|
| GoHighLevel | 163+ servers | Marketing automation |
| Odoo CRM | 310+ servers | Sales pipeline |
| HubSpot | Integration | Customer management |
| Salesforce | API patterns | Enterprise CRM |

## When to Activate

- Syncing customer data between systems
- Managing sales pipelines and stages
- Automating lead qualification
- Tracking customer interactions
- Generating quotes and proposals
- Analyzing sales performance

## Key Patterns

### 1. Customer Data Synchronization
\\\python
from dataclasses import dataclass
from typing import Optional, Dict
from datetime import datetime

@dataclass
class CustomerSyncResult:
    created: int = 0
    updated: int = 0
    conflicts: int = 0
    errors: int = 0

async def sync_customers(source: CRMClient, target: CRMClient) -> CustomerSyncResult:
    result = CustomerSyncResult()
    
    # Fetch all customers from source
    source_customers = await source.get_all_customers()
    
    for customer in source_customers:
        try:
            existing = await target.find_customer_by_email(customer.email)
            
            if existing:
                # Check for conflicts
                if has_meaningful_diff(existing, customer):
                    result.conflicts += 1
                    await log_conflict(customer, existing)
                else:
                    await target.update_customer(existing.id, customer)
                    result.updated += 1
            else:
                await target.create_customer(customer)
                result.created += 1
                
        except Exception as e:
            result.errors += 1
            await log_error(customer, e)
    
    return result
\\\

### 2. Sales Pipeline Automation
\\\python
class PipelineAutomation:
    def __init__(self, crm_client):
        self.client = crm_client
        self.stage_actions = {
            "new_lead": self.on_new_lead,
            "contacted": self.on_contacted,
            "qualified": self.on_qualified,
            "proposal": self.on_proposal,
            "negotiation": self.on_negotiation,
            "won": self.on_won,
            "lost": self.on_lost
        }
    
    async def advance_stage(self, deal_id: str, target_stage: str):
        deal = await self.client.get_deal(deal_id)
        
        if self.is_valid_transition(deal.stage, target_stage):
            await self.client.update_deal(deal_id, {"stage": target_stage})
            await self.stage_actions[target_stage](deal)
        else:
            raise InvalidStageTransition(deal.stage, target_stage)
    
    async def on_qualified(self, deal):
        # Send to sales team queue
        await self.assign_sales_rep(deal)
        # Start nurture sequence
        await self.enroll_in_sequence(deal.contact_id, "qualified_nurture")
        # Schedule follow-up tasks
        await self.create_follow_up_tasks(deal)
\\\

### 3. Lead Scoring System
\\\python
class LeadScorer:
    def __init__(self):
        self.weights = {
            "website_visits": 5,
            "email_opens": 2,
            "content_downloads": 10,
            "demo_requested": 30,
            "pricing_page_views": 15,
            "form_submissions": 20
        }
    
    def calculate_score(self, lead: Lead) -> int:
        score = 0
        
        # Engagement scoring
        score += lead.website_visits * self.weights["website_visits"]
        score += lead.email_opens * self.weights["email_opens"]
        score += lead.content_downloads * self.weights["content_downloads"]
        
        # Intent signals
        if lead.demo_requested:
            score += self.weights["demo_requested"]
        if lead.pricing_viewed:
            score += self.weights["pricing_page_views"]
        
        # Demographic fit
        score += self.company_size_score(lead.company_size)
        score += self.industry_score(lead.industry)
        
        return score
    
    def route_by_score(self, lead: Lead, score: int):
        if score >= 80:
            return "enterprise_sales"
        elif score >= 50:
            return "mid_market"
        elif score >= 20:
            return "smb"
        else:
            return "nurture"
\\\

### 4. Activity Logging
\\\python
async def log_customer_activity(customer_id: str, activity_type: str, data: Dict):
    activity = {
        "type": activity_type,
        "customer_id": customer_id,
        "timestamp": datetime.utcnow(),
        "data": data
    }
    
    # Log to CRM
    await crm_client.create_activity(activity)
    
    # Update customer timeline
    await crm_client.add_to_timeline(customer_id, activity)
    
    # Trigger workflows
    await trigger_activity_workflows(activity)
    
    # Sync to data warehouse
    await sync_activity_to_warehouse(activity)
\\\

## Best Practices

1. **Use bidirectional sync** with conflict resolution
2. **Implement lead scoring** for prioritization
3. **Automate stage transitions** with validation
4. **Log all activities** for complete history
5. **Handle GDPR compliance** with consent management
6. **Use webhooks** for real-time updates
7. **Implement deduplication** strategies

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| SyncConflict | Data mismatch | Use last-write-wins or manual |
| DuplicateRecord | Unmerged entry | Run deduplication |
| PermissionDenied | Access issue | Check API scopes |
| RateLimitExceeded | Too many requests | Implement backoff |
