---
name: prompt-engineering-best-practices
description: Comprehensive guide to crafting effective prompts for LLMs, covering techniques from basic to advanced levels.
origin: MCP Market
---
# Prompt Engineering Best Practices

## Overview
Comprehensive guide to crafting effective prompts for LLMs, covering techniques from basic to advanced levels.

## Key Principles

### 1. Clear Instruction Structure
- Start with explicit action verbs (analyze, summarize, generate)
- Use numbered steps for complex tasks
- Include constraints and format requirements
- Specify output structure explicitly

### 2. Context Provisioning
- Include relevant background information
- Provide examples (few-shot prompting)
- Define persona or perspective when applicable
- Set the domain/tone context

### 3. Prompt Components
[TASK] - What to do
[CONTEXT] - Background information
[CONSTRAINTS] - Limitations and rules
[FORMAT] - Output structure
[EXAMPLES] - Sample inputs/outputs

### 4. Advanced Techniques

#### Chain-of-Thought
- Ask model to explain reasoning step-by-step
- Improves accuracy on complex reasoning tasks
- Use "Let me think through this..." prefix

#### Zero-Shot vs Few-Shot
- Zero-shot: Direct instruction without examples
- Few-shot: Include 2-5 representative examples
- Few-shot works better for style/format replication

#### Constitutional AI Patterns
- Include ethical guidelines in prompts
- Add self-critique instructions
- Reference specific principles when needed

### 5. Iteration Strategies
- Test prompts with edge cases
- Measure success with evaluation metrics
- Refine based on failure patterns
- Version control prompts

## Common Pitfalls
- Ambiguous or conflicting instructions
- Missing constraints or boundaries
- Overloading with unnecessary context
- Assuming shared understanding

## Best Practices Checklist
- [ ] Clear, specific action verb
- [ ] Necessary context included
- [ ] Explicit format/sructure specified
- [ ] Constraints clearly stated
- [ ] Tested with diverse inputs
- [ ] Error handling considerations included

## MCP Integration
- Use prompt templates from skill library
- Store frequently-used prompts as MCP resources
- Implement prompt chaining for multi-step tasks
