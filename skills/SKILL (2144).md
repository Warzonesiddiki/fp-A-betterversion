---
name: web3-integration-javascript
description: Build frontend applications that interact with blockchain networks using ethers.js and viem.
origin: MCP Market
---

# Web3 Integration JavaScript

Specialized skill for building frontend applications that interact with blockchain networks.

## Client Libraries

### ethers.js (Recommended)
```javascript
import { BrowserProvider, Contract, parseEther } from 'ethers';

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const contract = new Contract(address, abi, signer);
const tx = await contract.transfer(recipient, parseEther("1.0"));
await tx.wait();
```

### viem (Alternative)
```javascript
import { createPublicClient, createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({ transport: http(), chain: mainnet });
const blockNumber = await client.getBlockNumber();
```

## Connection Patterns

### Wallet Connection Flow
```javascript
async function connect() {
    if (!window.ethereum) {
        throw new Error("No wallet detected");
    }
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });
    return accounts[0];
}

// Handle account changes
window.ethereum.on('accountsChanged', (accounts) => {
    updateState(accounts[0]);
});
```

### Chain Switching
```javascript
async function switchChain(chainId) {
    await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
}
```

## Transaction Patterns

### Sending Transactions
```javascript
async function sendTransaction(to, value) {
    const tx = {
        from: account,
        to,
        value: parseEther(value.toString()),
        gasLimit: 21000,
        maxFeePerGas: await provider.getFeeData()
    };
    const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [tx]
    });
    return txHash;
}
```

### Reading Contract Data
```javascript
// View functions - no signing needed
const balance = await contract.balanceOf(address);
const name = await contract.name();

// Filter events
const filter = contract.filters.Transfer(from, to);
const logs = await contract.queryFilter(filter, fromBlock, toBlock);
```

## State Management

```javascript
class Web3State {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.chainId = null;
        this.account = null;
    }

    async connect() {
        this.provider = new BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.account = await this.signer.getAddress();
        this.chainId = (await this.provider.getNetwork()).chainId;
    }
}
```

## Error Handling

```javascript
try {
    const tx = await contract.method(...);
    await tx.wait();
} catch (err) {
    if (err.code === 4001) {
        // User rejected
    } else if (err.reason) {
        // Custom revert reason
    } else {
        // Transaction failed
    }
}
```

## Common Patterns

- **Chain Detection**: Check `window.ethereum.isMetaMask`
- **Network Info**: `eth_chainId` + `net_version`
- **Signatures**: `personal_sign` for auth
- **Batch Calls**: Multicall contracts for efficiency

## Testing

```javascript
// Use local chain for tests
const provider = new JsonRpcProvider('http://127.0.0.1:8545');
const wallet = provider.getSigner(0);
// Deploy contracts, run integration tests
```