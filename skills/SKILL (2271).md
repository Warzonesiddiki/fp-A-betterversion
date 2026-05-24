---
name: aws-architecture-patterns
description: AWS architecture patterns including Well-Architected Framework, multi-tier architectures, event-driven designs, and enterprise-grade cloud solutions.
origin: https://docs.aws.amazon.com/wellarchitected
---

# AWS Architecture Patterns

## Well-Architected Framework Pillars

### 1. Operational Excellence
- Infrastructure as Code (CloudFormation, CDK)
- Automation and reproducibility
- Continuous improvement through feedback
- Documented runbooks and playbooks

### 2. Security
- Identity-first design (IAM, Cognito)
- Data protection (KMS, encryption)
- Detective controls (CloudTrail, GuardDuty)
- Infrastructure protection (WAF, Shield)

### 3. Reliability
- Recovery procedures (RTO/RPO)
- Scaling patterns (ASG, Aurora)
- Fault isolation (VPC, multi-AZ)
- Chaos engineering

### 4. Performance Efficiency
- Right-sizing resources
- Managed services
- Caching strategies
- Geographic distribution

### 5. Cost Optimization
- Pay-as-you-go model
- Reserved capacity planning
- Spot instances for batch workloads
- Cost allocation tags

## Common Architecture Patterns

### Three-Tier Architecture
```
Internet -> CloudFront -> ALB -> ASG -> EC2/ECS
                                    |
                              Aurora PostgreSQL
                                    |
                              ElastiCache Redis
```

### Event-Driven Architecture
```javascript
// EventBridge pattern
const rule = {
  name: 'order-events',
  eventPattern: {
    source: ['aws.ec2', 'aws.ecs'],
    'detail-type': ['EC2 Instance State-change Notification']
  },
  targets: [{
    Arn: lambdaArn,
    Id: 'process-events'
  }]
};

// SNS fan-out pattern
const message = {
  TopicArn: snsTopic,
  Message: JSON.stringify({ orderId, action: 'created' }),
  TargetArn: sqsQueueArn
};
```

### Microservices with ECS
```yaml
# ECS Service Discovery
Resources:
  Service:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref Cluster
      ServiceName: !Ref ServiceName
      TaskDefinition: !Ref TaskDefinition
      HealthCheckGracePeriodSeconds: 30
      ServiceRegistries:
        - RegistryArn: !GetAtt ServiceDiscoveryService.Arn
          Port: 80
```

### Landing Zone Architecture
```
Management Account
├── Shared Services (IAM, CloudTrail, Security Hub)
├── Log Archive (S3, CloudWatch Logs)
└── Audit (GuardDuty, Security Hub)

    OR
    OR
    OR

Member Accounts
├── Production
├── Development
├── Security Tools
└── Shared Services
```

## Design Patterns

### Strangler Fig Pattern (Migration)
1. Proxy requests to both old and new systems
2. Incrementally migrate functionality
3. Disable old system once verified

### Sidecar Pattern
- Attach utility containers to main application
- Shared volumes for config/secrets
- Example: logging, monitoring, proxy sidecars

### Ambassador Pattern
- Offload common client tasks
- Rate limiting, circuit breaking at proxy
- Connection pooling

### Anti-Patterns to Avoid
- Monolithic scaling
- Single point of failure
- Hard-coded credentials
- Synchronous dependencies without fallbacks

## Security Best Practices

```yaml
# Encrypted S3 with lifecycle
Resources:
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ArchiveRule
            Status: Enabled
            Transitions:
              - Days: 30
                StorageClass: STANDARD_IA
              - Days: 90
                StorageClass: GLACIER
```

## MCP Server Integration

Use these MCP servers for AWS operations:
- **AWS Official MCP** (awslabs/aws): Full AWS resource management
- **Kubernetes Manager**: EKS cluster management
- **CloudWatch**: Monitoring and logging
- **Terraform**: Infrastructure as Code

## Implementation Checklist

- [ ] Enable AWS Config rules
- [ ] Implement cost allocation tags
- [ ] Set up CloudTrail logging
- [ ] Configure GuardDuty threat detection
- [ ] Enable Security Hub aggregation
- [ ] Implement multi-AZ deployments
- [ ] Set up automated backups
- [ ] Configure alarm thresholds
