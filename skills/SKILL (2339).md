---
name: aws-cloud-patterns
description: AWS cloud architecture patterns including high availability, scalability, serverless patterns, event-driven architectures, and cost optimization.
origin: https://docs.aws.amazon.com/architecturecats
---

# AWS Cloud Patterns

## High Availability Patterns

### Multi-AZ Deployment
```yaml
# Aurora Multi-AZ
Resources:
  DBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      Engine: aurora-postgresql
      MultiAZ: true
      DBClusterInstanceClass: db.r6g.large
      StorageEncrypted: true
      
  WebServerASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 2
      MaxSize: 10
      VPCZoneIdentifier: !Split [",", !ImportValue PrivateSubnets]
      LaunchTemplate:
        LaunchTemplateId: !Ref WebServerLT
        Version: !GetAtt WebServerLT.LatestVersionNumber
```

### Global High Availability
- Route 53 with health checks and failover
- CloudFront for global content delivery
- S3 Cross-Region Replication

## Scalability Patterns

### Auto Scaling Configuration
```yaml
AutoScalingPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    AutoScalingGroupName: !Ref WebServerASG
    PolicyType: TargetTrackingScaling
    TargetTrackingConfiguration:
      PredefinedMetricSpecification:
        PredefinedMetricType: ASGAverageCPUUtilization
      TargetValue: 70
```

### Lambda Scaling
```javascript
// Concurrency settings for Lambda
exports.handler = async (event) => {
  // Reserved concurrency: guarantees capacity
  // Provisioned concurrency: pre-warmed instances
};

// SQS trigger for async processing
const handler = async (event) => {
  for (const record of event.Records) {
    await processMessage(JSON.parse(record.body));
  }
};
```

## Serverless Patterns

### API Gateway + Lambda
```yaml
# SAM template
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: src/handlers/api.handler
      Runtime: nodejs18.x
      Events:
        Api:
          Type: Api
          Properties:
            Path: /items
            Method: get
```

### Event-Driven Architecture
```javascript
// SNS to Lambda
exports.handler = async (event) => {
  const message = JSON.parse(event.Records[0].Sns.Message);
  console.log('Received:', message);
};

// EventBridge pattern
const rule = {
  name: 'order-created-rule',
  eventPattern: {
    source: ['com.orders'],
    'detail-type': ['OrderCreated']
  },
  targets: ['lambda-arn']
};
```

## Well-Architected Framework Pillars

### Operational Excellence
- Infrastructure as code
- Automated responses
- Quality testing

### Security
```yaml
# Encrypted S3 bucket policy
BucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref DataBucket
    PolicyDocument:
      Statement:
        - Sid: EnforceEncryption
          Effect: Deny
          Action: s3:*
          Resource:
            - !GetAtt DataBucket.Arn
            - !Sub "${DataBucket.Arn}/*"
          Condition:
            Bool:
              'aws:SecureTransport': false
```

### Reliability
- Graceful degradation
- Automatic recovery
- Multi-AZ deployments

### Cost Optimization
```yaml
# Cost-effective Lambda
Resources:
  LambdaFunction:
    Type: AWS::Serverless::Function
    Properties:
      MemorySize: 256  # Right-size memory
      Timeout: 30
      Runtime: nodejs18.x
      
# S3 Intelligent Tiering
Bucket:
  Type: AWS::S3::Bucket
  Properties:
    LifecycleConfiguration:
      Rules:
        - Id: IntelligentTiering
          Status: Enabled
          Transitions:
            - Days: 90
              StorageClass: GLACIER
```

## Common Architectures

### Three-Tier Web Application
```
Internet → CloudFront → ALB → ASG → EC2 (Auto Scaling)
                                    ↓
                              RDS Aurora (Multi-AZ)
                                    ↓
                              ElastiCache Redis
```

### Event-Driven Microservices
```
S3 Events → SNS → SQS → Lambda → DynamoDB
              ↓
         EventBridge → ECS Tasks
```

## Best Practices

1. **Use managed services**: Reduce operational burden
2. **Implement least privilege**: IAM roles with minimal permissions
3. **Enable encryption**: At rest and in transit
4. **Use security groups**: Network-level protection
5. **Implement caching**: CloudFront, ElastiCache, API Gateway caching
6. **Monitor costs**: Budgets, Cost Explorer, cost allocation tags
7. **Design for failure**: Assume any component can fail
8. **Automate responses**: CloudWatch alarms → SNS → Lambda
