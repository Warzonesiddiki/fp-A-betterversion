---
name: nft-marketplace-development
description: Specialized skill for building NFT marketplaces, minting platforms, and digital asset applications.
origin: MCP Market
---
# NFT Marketplace Development

Specialized skill for building NFT marketplaces, minting platforms, and digital asset applications.

## Marketplace Architecture

### Core Components
```
Frontend (React/Next.js)
    ↓
API Layer (indexing, caching)
    ↓
Contract Layer (marketplace, ERC-721)
    ↓
Storage (IPFS/Arweave for metadata)
```

### Contract Standards
```solidity
// ERC-721 for unique assets
interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

// ERC-721A for gas-efficient minting
// Supports batch minting at lower cost per token
```

## Marketplace Contract Patterns

### Dutch Auction
```solidity
contract DutchAuction {
    uint256 public startPrice;
    uint256 public discountRate;
    uint256 public startTime;

    function getPrice() public view returns (uint256) {
        uint256 elapsed = block.timestamp - startTime;
        uint256 discount = elapsed * discountRate;
        return startPrice > discount ? startPrice - discount : 0;
    }
}
```

### English Auction
```solidity
struct Auction {
    address highestBidder;
    uint256 highestBid;
    uint256 endTime;
    mapping(address => uint256) bids;
}

function bid() external payable {
    require(block.timestamp < auction.endTime);
    require(msg.value > auction.highestBid);
    // Return funds to previous bidder
    auction.bids[auction.highestBidder] = auction.highestBid;
    auction.highestBidder = msg.sender;
    auction.highestBid = msg.value;
}
```

### Royalty Enforcement (EIP-2981)
```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice) 
    external view returns (address receiver, uint256 royaltyAmount) {
    return (royaltyRecipient, (salePrice * royaltyBps) / 10000);
}
```

## Listing Types

| Type | Buyer Pays | Use Case |
|------|------------|----------|
| Fixed Price | Immediately | Collections, utility |
| Auction | At end | Collectibles, art |
| Offer | Optional | Negotiations |
| Dutch | Time-decaying |高波动期 |

## Metadata Storage

### IPFS Pattern
```javascript
const metadata = {
    name: "NFT Name",
    description: "Description",
    image: "ipfs://QmXxx...",
    attributes: [
        { trait_type: "Background", value: "Blue" },
        { display_type: "date", trait_type: "Created", value: 1699999999 }
    ]
};

// Upload to IPFS via Pinata, NFT.storage, or web3.storage
const cid = await pinToIPFS(JSON.stringify(metadata));
const uri = `ipfs://${cid}`;
```

## Frontend Integration

```javascript
// Listing an NFT
async function createListing(tokenAddress, tokenId, price) {
    const contract = new Contract(marketplaceAddress, marketplaceAbi, signer);
    const priceWei = parseEther(price.toString());
    
    // Approve marketplace to handle NFT
    const nftContract = new Contract(tokenAddress, erc721Abi, signer);
    await nftContract.approve(marketplaceAddress, tokenId);
    
    // Create listing
    const tx = await contract.createListing(tokenAddress, tokenId, priceWei);
    await tx.wait();
}

// Purchasing
async function buy(tokenId) {
    const tx = await contract.buy(tokenId, { value: listingPrice });
    await tx.wait();
}
```

## Security Considerations

- **Frontrunning**: Use minimum bid increments, batch transactions
- **Signature Replay**: Include chain ID and nonce
- **Royalty Bypass**: Use operator filtering (ERC-721Council)
- **Lazy Minting**: Off-chain signatures, on-chain redemption
