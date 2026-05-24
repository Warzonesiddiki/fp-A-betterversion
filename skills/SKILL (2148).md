---
name: vector-database-patterns
description: Implement efficient vector search and semantic retrieval using modern vector databases and embedding strategies.
origin: MCP Market
---

# Vector Database Patterns

## Overview
Patterns for implementing efficient vector search and semantic retrieval using modern vector databases and embedding strategies.

## MCP Market References
- **Chroma** (544 stars) - MCP server with Chroma vector DB
- **LanceDB** (10k stars) - Embedded retrieval engine for multimodal AI
- **MindsDB** (39k stars) - Federated query engine for AI
- **Cognee** (17k stars) - Memory layer with embedding support

## Core Concepts

### 1. Embedding Generation
- Choose appropriate embedding models (OpenAI, sentence-transformers, etc.)
- Match embedding dimension to database requirements
- Handle multilingual content appropriately
- Consider domain-specific fine-tuned embeddings

### 2. Vector Storage Patterns
Document -> Embedding Model -> Vector + Metadata -> Vector Database
Query -> Embedding Model -> Vector -> Similarity Search -> Results

### 3. Indexing Strategies
- HNSW for approximate nearest neighbor (ANN) search
- IVF (Inverted File Index) for clustering
- PQ (Product Quantization) for compression
- Hybrid indexing for combined dense/sparse vectors

### 4. Search Patterns

#### Semantic Search
- Full-text semantic similarity
- Hybrid search (keyword + semantic)
- Reranking with cross-encoders

#### Filtering
- Pre-filtering with metadata
- Post-filtering for post-processing
- Dynamic filtering with faceted search

### 5. Scaling Patterns
- Sharding for distributed vector DB
- Replication for high availability
- Caching frequently queried vectors
- Batch ingestion for bulk operations

## Vector Database Selection

| DB | Best For | Scale | Language |
|----|----------|-------|----------|
| Chroma | Prototyping, local dev | Small-Medium | Python |
| LanceDB | Embedded, multimodal | Medium-Large | Multi |
| Pinecone | Production, managed | Large | API |
| Weaviate | Hybrid search | Large | Multi |
| Qdrant | High precision | Large | Rust |

## Best Practices
1. Normalize vectors for cosine similarity
2. Monitor embedding drift over time
3. Implement hybrid search for better recall
4. Use metadata filtering to reduce search space
5. Batch operations for efficiency
6. Plan for reindexing during updates

## RAG Integration Patterns
- Chunk documents intelligently (sliding window, semantic)
- Store document hierarchy for context retrieval
- Implement query decomposition
- Use reranking for improved relevance