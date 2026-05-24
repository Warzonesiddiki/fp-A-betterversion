---
name: defi-protocol-patterns
description: Understanding, designing, and implementing decentralized finance protocols.
origin: MCP Market
---

# DeFi Protocol Patterns

Specialized skill for understanding, designing, and implementing decentralized finance protocols.

## Core DeFi Primitives

### Automated Market Makers (AMM)
```javascript
// Constant Product AMM: x * y = k
function getAmountOut(amountIn, reserveIn, reserveOut) internal pure returns (uint amountOut) {
    uint amountInWithFee = amountIn * (1000 - fee);
    uint numerator = amountInWithFee * reserveOut;
    uint denominator = reserveIn * 1000 + amountInWithFee;
    return numerator / denominator;
}
```

### Liquidity Provision
- **LP Tokens**: Represent share of pool
- **Impermanent Loss**: Value divergence when prices change
- **Concentrated Liquidity**: Uniswap V3 style ranges

### Yield Farming
- **Staking Rewards**: Lock tokens for emissions
- **Yield Aggregators**: Yearn, Beefy vault strategies
- **Compounding**: Auto-reinvest rewards

## Protocol Types

### Lending/Borrowing
```
User Deposits Collateral → Borrows Against It → Repay + Interest
```
- **Collateral Factor**: % of value that can be borrowed
- **Liquidation Threshold**: When positions become unsafe
- **Liquidation Bonus**: Incentive for keepers

### Decentralized Exchanges
| Type | Example | Mechanism |
|------|---------|-----------|
| AMM | Uniswap | Constant product |
| Order Book | dYdX | On-chain matching |
| Aggregator | 1inch | Route optimization |

### Derivatives
- **Perpetual Contracts**: Everlasting futures (GMX, dYdX)
- **Options**: Right to buy/sell at strike
- **Structured Products**: Principal protected, yield enhancement

## Security Patterns

### Oracle Patterns
```javascript
// Chainlink Price Feed
AggregatorV3Interface priceFeed = AggregatorV3Interface(0x...);
(, int price,,,) = priceFeed.latestRoundData();

// TWAP for synthetic oracles
// Time-weighted average over window
```

### Flash Loans
```solidity
function flashLoan(address borrower, address token, uint256 amount) external {
    IERC20(token).transfer(borrower, amount);
    // User executes strategy
    IERC20(token).transferFrom(borrower, address(this), amount + fee);
}
```

## Composability Risks

- **Reentrancy**: Check-effects-interactions pattern
- **Oracle Manipulation**: TWAP, snapshot oracles
- **Governance Attacks**: Flash loan on governance tokens
- **Impermanent Loss**: hedging strategies

## Gas Optimization

- Batch storage operations
- Use memory over calldata for arrays
- Event emissions instead of storage writes
- Internal functions don't need ABI encoding

## Testing Checklist

- [ ] Price oracle resilience
- [ ] Liquidation mechanics
- [ ] Slippage protection
- [ ] Sandwich attack mitigation
- [ ] Front-running protection