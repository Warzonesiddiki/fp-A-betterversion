---
name: gemini-cli-advanced
description: Advanced command-line interface capabilities for Google Gemini models, enabling deep codebase analysis, multi-file context management, and programmatic development workflows.
origin: MCP Market
---
# Gemini CLI Advanced

Advanced command-line interface capabilities for Google Gemini models, enabling deep codebase analysis, multi-file context management, and programmatic development workflows.

## Core Capabilities

- **Massive Context Windows**: Leverage Gemini's large token limits for analyzing entire codebases
- **Persistent Semantic Memory**: Store and retrieve learned patterns across sessions
- **Tool Usage**: Execute commands, read files, and modify codebases programmatically
- **Subprocess Management**: Secure handling of CLI invocations with proper escaping
- **Context-Heavy Task Execution**: Handle complex, multi-file development tasks

## Usage

Invoke via `/gemini-cli-advanced` when you need to:
- Analyze large files or entire repositories
- Perform deep codebase understanding tasks
- Chain multiple Gemini CLI operations
- Maintain context across complex development sessions

## Workflow Integration

1. Initialize Gemini CLI session
2. Load codebase context via file reading
3. Execute targeted commands with proper argument escaping
4. Parse structured results and execution metadata
5. Return formatted responses to the calling agent

## Best Practices

- Always verify Gemini CLI is installed: `gemini --version`
- Use absolute paths for file operations
- Handle large outputs by streaming results
- Implement proper error handling for CLI failures
- Cache frequently accessed context for performance

## Related Skills

- `gemini-model-optimization` - Optimize model parameters and prompts
- `multi-model-orchestration` - Coordinate multiple AI models
- `antigravity-integration` - Connect to Antigravity ecosystem
