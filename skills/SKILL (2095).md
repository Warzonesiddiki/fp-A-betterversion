---
name: blockchain-development-basics
description: Foundational skill for understanding blockchain architecture, consensus mechanisms, and core development concepts.
origin: MCP Market
---

# Blockchain Development Basics

Foundational skill for understanding blockchain architecture, consensus mechanisms, and core development concepts.

## Core Concepts

### Blockchain Fundamentals
- **Distributed Ledger**: Immutable record shared across nodes
- **Consensus Mechanisms**: Proof of Work, Proof of Stake, Delegated PoS
- **Cryptographic Hashing**: SHA-256, Keccak-256 for integrity
- **Digital Signatures**: ECDSA for transaction authentication
- **Merkle Trees**: Efficient verification of data integrity

### Account Models
```
EOA (Externally Owned Account) → Private Key → Public Key → Address
Contract Account → Code Hash → Storage Hash
```

### Transaction Lifecycle
1. Construct transaction with `to`, `value`, `data`, `gasLimit`, `gasPrice`
2. Sign with private key
3. Broadcast to mempool
4. Validator includes in block
5. State update on execution

## EVM Architecture

### Memory Model
| Type | Scope | Persistence |
|------|-------|-------------|
| Stack | Function calls | Volatile |
| Memory | Temporary data | Volatile |
| Storage | Persistent state | On-chain |

### Gas Economics
- **Base Fee**: Network-determined minimum
- **Priority Fee**: Tip to validators
- **OpCode Costs**: Each operation has gas cost
- **Optimization**: Batch storage reads/writes

## Development Environments

| Environment | Use Case | Command |
|-------------|----------|---------|
| Hardhat | Ethereum development | `npx hardhat node` |
| Foundry | Fast testing/contracts | `forge init` |
| Anvil | Local testnet | `anvil` |
| Remix | Quick prototyping | remix.ethereum.org |

## Network Types

```
Mainnet → Production (real assets)
Testnet → Sepolia, Holesky (testing)
Local → Anvil/Ganache (development)
L2 → Arbitrum, Optimism (scalability)
```

## Key Terminology

- **Block Confirmations**: Blocks after your transaction
- **Nonce**: Transaction counter per account
- **Chain ID**: Network identifier (1=Ethereum mainnet)
- **Gas Limit**: Max computation per block
- **Difficulty/Target**: Block time regulation

## Common Patterns

- **Multi-sig**: Multiple signers required
- **Timelock**: Delayed execution
- **Oracle**: External data injection
- **Cross-chain**: Bridge assets between chains

## Resources

- [Ethereum Docs](https://ethereum.org/developers)
- [EVM Codes](https://www.evm.codes/)
- [Solidity Docs](https://docs.soliditylang.org/)