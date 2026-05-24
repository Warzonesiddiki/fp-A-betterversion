---
name: terraform-basics
description: Terraform fundamentals including providers, resources, data sources, variables, outputs, state management, and modules.
origin: https://developer.hashicorp.com/terraform/docs
---

# Terraform Basics

## Core Concepts

### Provider Configuration
```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

### Resources
```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  })
  
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }
  
  tags = {
    Name = "${var.environment}-web-server"
  }
}
```

## Variables and Outputs

### Input Variables
```hcl
variable "aws_region" {
  type        = string
  description = "AWS region for resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "instance_config" {
  type = object({
    instance_type = string
    ami_id        = string
    volume_size   = number
  })
  description = "EC2 instance configuration"
  default = {
    instance_type = "t3.micro"
    ami_id        = "ami-0c55b159cbfafe1f0"
    volume_size   = 20
  }
}
```

### Output Values
```hcl
output "instance_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "connection_info" {
  description = "SSH connection string"
  value       = "ssh -i key.pem ec2-user@${aws_instance.web.public_ip}"
  sensitive   = false
}
```

## Data Sources
```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-22.04-amd64-server-*"]
  }
}

data "aws_vpc" "default" {
  default = true
}
```

## State Commands

```bash
# Initialize backend and download providers
terraform init

# Format code to canonical style
terraform fmt

# Validate configuration
terraform validate

# Create execution plan
terraform plan -out=plan.tfplan

# Apply changes
terraform apply plan.tfplan
terraform apply -auto-approve

# Destroy resources
terraform destroy -auto-approve

# List resources in state
terraform state list

# Show resource details
terraform state show aws_instance.web

# Move resource in state
terraform state mv aws_instance.old aws_instance.new

# Remove from state
terraform state rm aws_instance.old

# Import existing resource
terraform import aws_instance.existing i-1234567890abcdef0
```

## Workspaces

```bash
# Create and switch workspaces
terraform workspace new dev
terraform workspace select prod

# List workspaces
terraform workspace list

# Show current workspace
terraform workspace show
```

## Functions

```hcl
# Common functions used in Terraform
locals {
  # String interpolation
  name = "${var.environment}-${var.app_name}"
  
  # Merge maps
  common_tags = merge(var.tags, {
    Environment = var.environment
  })
  
  # Conditional
  instance_type = var.is_production ? "t3.large" : "t3.micro"
}
```

## Best Practices

1. **Use remote backend**: S3 with DynamoDB for state locking
2. **Pin provider versions**: Avoid unexpected breaking changes
3. **Use modules**: Reuse and organize infrastructure
4. **Meaningful naming**: Use consistent naming conventions
5. **Separate state per environment**: Don't share state
6. **Version control state**: Enable versioning on S3
7. **Use -out with plan**: Ensure planned changes match applied
8. **Import existing resources**: Don't destroy pre-existing infrastructure
