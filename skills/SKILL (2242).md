---
name: customer-loyalty-program
description: Use this skill when designing and implementing customer loyalty programs, managing reward points, automating member benefits, or analyzing loyalty program performance. Provides patterns for loyalty and rewards systems.
origin: MCP Market E-commerce Category
---

# Customer Loyalty Program Skill

Design, implement, and manage customer loyalty programs with points, rewards, and engagement automation.

## When to Activate

- Creating loyalty program rules and tiers
- Managing points accumulation and redemption
- Implementing member segmentation
- Automating reward delivery
- Analyzing loyalty program metrics
- Handling loyalty-related exceptions

## Key Patterns

### 1. Points Accumulation Engine
\\\python
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime, timedelta

@dataclass
class PointsTransaction:
    member_id: str
    points: int
    transaction_type: str  # earn, redeem, expire, adjust
    reference_id: str
    description: str
    expires_at: Optional[datetime] = None
    created_at: datetime = None

class LoyaltyPointsEngine:
    def __init__(self, tier_config: Dict):
        self.tier_config = tier_config
    
    async def earn_points(self, member_id: str, base_amount: float, transaction_type: str = "purchase") -> PointsTransaction:
        member = await self.get_member(member_id)
        
        # Calculate multiplier based on tier
        multiplier = self.tier_config[member.tier].earning_multiplier
        
        # Apply transaction-specific rules
        points = self.calculate_points(base_amount, transaction_type, multiplier)
        
        # Check for bonus promotions
        bonus = await self.get_promotion_bonus(member_id, transaction_type)
        points += bonus
        
        transaction = PointsTransaction(
            member_id=member_id,
            points=points,
            transaction_type="earn",
            reference_id=generate_idempotency_key(),
            description=f"Earned {points} points from {transaction_type}",
            expires_at=datetime.utcnow() + timedelta(days=365) if transaction_type != "bonus" else None
        )
        
        await self.record_transaction(transaction)
        await self.check_tier_upgrade(member_id)
        
        return transaction
    
    def calculate_points(self, amount: float, transaction_type: str, multiplier: float) -> int:
        base_rates = {
            "purchase": 1.0,      # 1 point per dollar
            "referral": 500,       # Flat bonus
            "review": 100,          # Flat bonus
            "birthday": 200         # Flat bonus
        }
        
        if transaction_type in base_rates:
            if isinstance(base_rates[transaction_type], float):
                return int(amount * base_rates[transaction_type] * multiplier)
            return int(base_rates[transaction_type] * multiplier)
        
        return 0
\\\

### 2. Tier Management System
\\\python
class TierManager:
    tiers = [
        {"name": "Bronze", "min_spend": 0, "multiplier": 1.0},
        {"name": "Silver", "min_spend": 500, "multiplier": 1.25},
        {"name": "Gold", "min_spend": 1500, "multiplier": 1.5},
        {"name": "Platinum", "min_spend": 5000, "multiplier": 2.0}
    ]
    
    async def evaluate_member_tier(self, member_id: str) -> str:
        member = await self.get_member(member_id)
        annual_spend = await self.calculate_annual_spend(member_id)
        
        for tier in reversed(self.tiers):
            if annual_spend >= tier["min_spend"]:
                return tier["name"]
        
        return "Bronze"
    
    async def check_and_upgrade(self, member_id: str):
        current_tier = await self.get_member_tier(member_id)
        new_tier = await self.evaluate_member_tier(member_id)
        
        if self.get_tier_rank(new_tier) > self.get_tier_rank(current_tier):
            await self.upgrade_member(member_id, new_tier)
            await self.send_tier_upgrade_notification(member_id, new_tier)
\\\

### 3. Points Redemption Flow
\\\python
class RedemptionProcessor:
    def __init__(self, rewards_catalog: Dict, points_to_currency_rate: float = 0.01):
        self.rewards = rewards_catalog
        self.rate = points_to_currency_rate
    
    async def redeem_points(self, member_id: str, reward_id: str, quantity: int = 1) -> Dict:
        member = await self.get_member(member_id)
        reward = self.rewards.get(reward_id)
        
        if not reward:
            raise RewardNotFoundError(reward_id)
        
        if not reward.available:
            raise RewardOutOfStockError(reward_id)
        
        points_required = reward.points_cost * quantity
        
        if member.points_balance < points_required:
            raise InsufficientPointsError(member.points_balance, points_required)
        
        # Deduct points
        await self.deduct_points(member_id, points_required)
        
        # Fulfill reward
        fulfillment = await self.fulfill_reward(member, reward, quantity)
        
        # Log transaction
        await self.record_redemption(member_id, reward_id, points_required, fulfillment.id)
        
        return fulfillment
    
    async def fulfill_reward(self, member: Member, reward: Reward, quantity: int):
        if reward.type == "discount":
            return await self.fulfill_discount(member, reward, quantity)
        elif reward.type == "free_product":
            return await self.fulfill_product(member, reward, quantity)
        elif reward.type == "experience":
            return await self.fulfill_experience(member, reward, quantity)
        else:
            return await self.fulfill_generic(member, reward, quantity)
\\\

### 4. Program Analytics
\\\python
class LoyaltyAnalytics:
    async def calculate_member_lifetime_value(self, member_id: str) -> float:
        member = await self.get_member(member_id)
        
        total_purchases = await self.get_member_purchases(member_id)
        total_points_earned = await self.get_points_earned(member_id)
        total_points_redeemed = await self.get_points_redeemed(member_id)
        
        purchase_value = sum(p.amount for p in total_purchases)
        points_value = (total_points_earned - total_points_redeemed) * self.points_to_currency_rate
        
        return purchase_value - points_value
    
    async def calculate_churn_risk(self, member_id: str) -> Dict:
        member = await self.get_member(member_id)
        
        days_since_last_activity = (datetime.now() - member.last_activity).days
        activity_trend = await self.get_activity_trend(member_id, 90)
        redemption_rate = await self.get_redemption_rate(member_id, 90)
        
        risk_factors = {
            "inactivity_days": days_since_last_activity,
            "declining_engagement": activity_trend < 0.5,
            "low_redemption": redemption_rate < 0.1
        }
        
        risk_score = sum([
            1 if days_since_last_activity > 90 else 0,
            1 if risk_factors["declining_engagement"] else 0,
            1 if risk_factors["low_redemption"] else 0
        ])
        
        return {
            "risk_level": ["low", "medium", "high", "critical"][risk_score],
            "risk_score": risk_score,
            "factors": risk_factors
        }
\\\

## Best Practices

1. **Set clear tier thresholds** with achievable goals
2. **Make points valuable** with favorable redemption rates
3. **Communicate transparently** about point expiration
4. **Offer exclusive experiences** for top tiers
5. **Gamify engagement** with challenges and badges
6. **Personalize offers** based on purchase history
7. **Analyze ROI** and adjust program economics

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| InsufficientPoints | Not enough balance | Show points needed |
| RewardOutOfStock | Item unavailable | Offer alternatives |
| TierNotEligible | Doesn't meet criteria | Show requirements |
| PointsExpired | Points past expiry | Check expiry policy |
