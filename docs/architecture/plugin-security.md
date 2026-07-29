# Plugin Security Architecture

## Overview

FinPlan Pro plugins execute within a hardened sandbox (`PluginSandbox`) to prevent malicious code execution and data exfiltration.

## Security Controls

- **Capability Isolation**: Plugins only access declared capabilities and sandboxed API subsets.
- **Resource Limits**: Strict CPU and memory limits prevent infinite loops and memory exhaustion.
- **Network Restrictions**: Outbound fetch requests are intercepted and blocked unless explicitly whitelisted.
