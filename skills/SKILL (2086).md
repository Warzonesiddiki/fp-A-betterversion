---
name: crypto-payment-integration
description: Accept cryptocurrency payments in applications, commerce platforms, and financial systems.
origin: MCP Market
---

# Crypto Payment Integration

Specialized skill for accepting cryptocurrency payments in applications, commerce platforms, and financial systems.

## Payment Integration Patterns

### Direct Integration
```javascript
// Generate payment address
async function generatePayment(currency, amountUSD) {
    const exchangeRate = await getExchangeRate(currency);
    const amountCrypto = amountUSD / exchangeRate;
    
    return {
        address: await generateAddress(currency),
        amount: amountCrypto,
        currency,
        expiry: Date.now() + 30 * 60 * 1000
    };
}
```

### Payment Detection
```javascript
// WebSocket subscription for incoming
const ws = new WebSocket('wss://blockstream.info/api/wallet/...');

ws.on('message', (event) => {
    const data = JSON.parse(event);
    if (data.action === 'confirmed' && data.amount > 0) {
        fulfillOrder(data.paymentId);
    }
});
```

## Supported Tokens

### By Network
```
Ethereum (ERC-20)
    ├── Stablecoins: USDC, USDT, DAI
    ├── Wrapped Assets: WBTC, WETH
    └── Governance: LINK, UNI

Bitcoin (UTXO)
    └── Native BTC

Alternative L1/L2
    ├── Solana (SPL tokens)
    ├── Polygon (ERC-20)
    └── Arbitrum, Optimism
```

## Payment Flow

```
1. Create Order → Amount in fiat
2. Generate Invoice → Convert to crypto amount
3. Display QR/Address → Customer sends payment
4. Monitor Blockchain → Detect payment
5. Confirm Order → Payment reached threshold
6. Settlement → Convert to fiat or hold
```

## Invoice Generation

```javascript
class CryptoInvoice {
    constructor(config) {
        this.network = config.network;
        this.settlement = config.settlement; // 'fiat' | 'crypto'
        this.confirmations = config.confirmations || 1;
    }

    async create(amount, currency, fiatCurrency = 'USD') {
        const rate = await this.getRate(currency, fiatCurrency);
        const invoice = {
            id: generateUUID(),
            amountCrypto: amount / rate,
            amountFiat: amount,
            currency,
            address: await this.getDepositAddress(),
            expiresAt: Date.now() + 30 * 60 * 1000,
            qrData: this.buildQRData()
        };
        await this.store(invoice);
        return invoice;
    }
}
```

## Price Fetching

| Provider | Method | Notes |
|----------|--------|-------|
| CoinGecko | API | Free tier available |
| CoinMarketCap | API | Requires API key |
| Chainlink | On-chain | Decentralized |
| Uniswap | DEX | Real-time swap price |

## Webhook Configuration

```javascript
// Server endpoint for payment notifications
app.post('/api/webhooks/crypto', async (req, res) => {
    const signature = req.headers['x-signature'];
    const payload = req.body;
    
    if (!verifySignature(payload, signature)) {
        return res.status(401).send('Invalid signature');
    }
    
    const { txHash, amount, confirmations } = payload;
    const payment = await getPaymentByTx(txHash);
    
    if (confirmations >= payment.requiredConfirmations) {
        await fulfillPayment(payment.orderId);
    }
    
    res.status(200).send('OK');
});
```

## Security Practices

- **Double spend protection**: Wait for confirmations
- **Refund handling**: Send to original sender address
- **Address validation**: Checksum, format validation
- **Rate validation**: Re-verify rate before confirmation
- **Monitor for underpayments**: Flag and investigate

## Reconciliation

```javascript
async function reconcile() {
    const onChainTxs = await getOnChainTransactions(addresses);
    const dbPayments = await getPendingPayments();
    
    // Match blockchain to database records
    for (const tx of onChainTxs) {
        const payment = dbPayments.find(p => 
            p.address === tx.address && 
            p.amount.satisfied(tx.value)
        );
        if (payment) {
            await confirmPayment(payment.id, tx);
        }
    }
}
```

## Compliance Notes

- KYC requirements vary by jurisdiction
- Transaction monitoring for AML
- Travel rule for transfers over threshold
- Tax reporting for crypto transactions