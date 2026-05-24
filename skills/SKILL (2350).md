---
name: infrastructure-as-code
description: Infrastructure as Code principles including version control, state management, modules, drift detection, and idempotent configurations.
origin: https://docs.microsoft.com/en-us/devops/deliver/what-is-infrastructure-as-code
---

# Infrastructure as Code

## Core Principles

### 1. Everything in Version Control
- All infrastructure configs in Git
- Infrastructure changes via pull requests
- Required peer reviews for changes

### 2. Idempotent Operations
- Applying config multiple times produces same result
- Use "ensure state" patterns, not imperative commands

### 3. Self-Documenting Infrastructure
```yaml
# Resource with descriptive naming
resource:
  name: prod-web-server
  type: aws_instance
  description: "Production web servers in us-east-1"
  tags:
    Environment: production
    Team: platform
    CostCenter: engineering
```

## State Management

### State File Structure
```json
{
  "version": 4,
  "terraform_version": "1.6.0",
  "serial": 5,
  "outputs": {},
  "resources": []
}
```

### State Locking
- Prevents concurrent modifications
- Essential for team environments
- Backend must support locking (S3+DynamoDB, Azure Blob, etc.)

### State Manipulation Commands
```bash
# View state
terraform state list
terraform state show aws_instance.web

# Move resources
terraform state mv aws_instance.old aws_instance.new

# Remove from state (doesn't delete resource)
terraform state rm aws_instance.decommissioned
```

## Module Design

### Module Structure
```
modules/
  networking/
    main.tf
    variables.tf
    outputs.tf
    versions.tf
    README.md
```

### Module Best Practices
```hcl
variable "environment" {
  type        = string
  description = "Deployment environment"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
  sensitive   = false
}
```

## Drift Detection

### Plan for Drift
```bash
# Detect differences between state and reality
terraform plan -out=drift.tfplan

# Refresh state from provider
terraform refresh

# Import existing resources
terraform import aws_instance.existing i-1234567890abcdef0
```

### Workflow for Drift
1. Run `terraform plan` to identify drift
2. Review changes carefully
3. Either:
   - Apply to make infrastructure match code
   - Update code to match reality
   - Import missing resources

## Workflow Patterns

### GitOps Workflow
```yaml
# Automated PR workflow
name: IaC Review
on:
  pull_request:
    paths:
      - 'infrastructure/**'
      - 'terraform/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v2
      - run: terraform init
      - run: terraform plan -no-color
```

## Best Practices

1. **Use remote state**: Never use local state in production
2. **Enable state locking**: Prevents corruption
3. **Use workspaces sparingly**: Prefer separate state files
4. **Modularize**: Create reusable components
5. **Validate inputs**: Use variable validation
6. **Protect sensitive outputs**: Mark sensitive outputs appropriately
7. **Backup state**: Enable versioning on state backend
8. **Never edit state manually**: Use terraform commands only
