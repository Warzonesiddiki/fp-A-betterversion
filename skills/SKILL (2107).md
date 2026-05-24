---
name: multi-model-orchestration
description: Coordinate and orchestrate interactions across multiple AI models, enabling intelligent routing, model-specific optimization, and hybrid workflows for complex tasks.
origin: MCP Market
---
# Multi-Model Orchestration

Coordinate and orchestrate interactions across multiple AI models, enabling intelligent routing, model-specific optimization, and hybrid workflows for complex tasks.

## Core Capabilities

- **Intelligent Routing**: Direct tasks to optimal models based on capability requirements
- **Model Diversity**: Leverage Claude, GPT-4o, Gemini, and Antigravity in unified workflows
- **Result Aggregation**: Synthesize outputs from multiple model responses
- **Fallback Strategies**: Graceful degradation when primary models fail
- **Cost-Performance Balance**: Optimize model selection for task requirements

## Supported Models

- **Anthropic Claude**: Reasoning, coding, analysis
- **OpenAI GPT-4o**: Creative tasks, API development
- **Google Gemini**: Large context, vision, code execution
- **Antigravity**: Cloud operations, multi-agent orchestration
- **Local Models (Ollama)**: Privacy-sensitive, offline processing

## Orchestration Patterns

### 1. Sequential Pipeline
```
Input -> Model A -> Model B -> Model C -> Output
```
Use for: Multi-stage refinement, validation chains

### 2. Parallel Fan-out
```
Input -> [Model A, Model B, Model C] -> Aggregation -> Output
```
Use for: Redundancy, diverse perspectives, voting

### 3. Hierarchical Routing
```
Task -> Router -> Specialist Model -> Aggregator -> Output
```
Use for: Complex multi-domain tasks requiring different expertise

### 4. Agent Coordination
```
Orchestrator -> [Agent 1, Agent 2, ...] -> Coordination -> Result
```
Use for: Autonomous multi-agent workflows

## Usage

Invoke via `/multi-model-orchestration` when:
- Tasks require diverse AI capabilities
- Building redundant systems for reliability
- Implementing cost-performance optimizations
- Coordinating multi-agent autonomous workflows
- Creating ensemble approaches for complex problems

## Best Practices

- Define clear interfaces between model stages
- Implement proper error handling and fallbacks
- Track model-specific costs and performance
- Use structured output formats for reliable parsing
- Maintain context coherence across model boundaries
- Enable result caching across similar queries

## MCP Integration

Connect to MCP servers for model access:
- OmniLLM: Universal LLM connector with monitoring
- OpenClaw Antigravity: Free Claude Opus, Sonnet, Gemini 3
- Solve Runner: Multi-round agent collaboration

## Related Skills

- `antigravity-integration` - Antigravity model access
- `gemini-cli-advanced` - Gemini CLI integration
- `agent-swarm-orchestrator` - Multi-agent coordination
- `llm-integration-patterns` - General LLM integration patterns
