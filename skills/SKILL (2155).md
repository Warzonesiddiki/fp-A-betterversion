---
name: solidity-smart-contracts
description: Write, test, and deploy secure smart contracts on Ethereum and EVM-compatible chains.
origin: MCP Market
---

# Solidity Smart Contracts

Specialized skill for writing, testing, and deploying secure smart contracts on Ethereum and EVM-compatible chains.

## Core Workflows

### 1. Contract Architecture
```
Pragma → Imports → Interfaces → Libraries → State Variables → Events → Errors → Constructor → Functions
```

### 2. Modern Solidity Patterns
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyContract {
    error Unauthorized();
    error InvalidAmount(uint256 amount);

    event TransferCompleted(address indexed from, address indexed to, uint256 amount);

    mapping(address => uint256) private _balances;

    function deposit() external payable {
        if (msg.value == 0) revert InvalidAmount(0);
        _balances[msg.sender] += msg.value;
        emit TransferCompleted(address(0), msg.sender, msg.value);
    }
}
```

### 3. Security Patterns
- **Checks-Effects-Interactions**: Always update state before external calls
- **Reentrancy Guards**: Use `ReentrancyGuard` from OpenZeppelin
- **Access Control**: Use `Ownable`, `AccessControl`, or role-based patterns
- **Integer Overflow**: Use Solidity 0.8+ built-in checks or `SafeMath` for older versions
- **Pausability**: Implement emergency stop mechanisms

### 4. Testing Strategy
```javascript
// Foundry/Forge test
contract MyContractTest {
    function testDeposit() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        contract.deposit{value: 1 ether}();
        assertEq(contract.balances(user), 1 ether);
    }
}
```

## Key Conventions

- Use named returns for complex functions
- Emit events for all state changes
- Custom errors over require strings (gas efficient)
- NatSpec comments for public APIs
- Contract size limits: stay under 24KB target
- Use libraries for repeated logic

## Toolchain

| Task | Tool |
|------|------|
| Compile | `forge build`, `hardhat compile` |
| Test | `forge test`, `hardhat test` |
| Deploy | `forge script`, `hardhat deploy` |
| Verify | `forge verify-contract`, `npx hardhat verify` |
| Lint | `solhint`, `prettier-plugin-solidity` |

## Security Checklist

- [ ] Reentrancy protection on external transfers
- [ ] Access control on privileged functions
- [ ] Input validation and bounds checking
- [ ] Emergency withdrawal pattern
- [ ]pausable for incident response
- [ ] Upgrade pattern if applicable (UUPS/Proxy)
- [ ] Event emission for transparency