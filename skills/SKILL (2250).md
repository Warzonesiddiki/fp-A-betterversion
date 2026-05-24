---
name: cloud-cost-optimization
description: Cloud cost optimization strategies including right-sizing, reserved instances, savings plans, spot instances, and FinOps practices.
origin: https://docs.aws.amazon.com/cost-management
---

# Cloud Cost Optimization

## FinOps Principles

### Core Practices
1. **Informed** - Know where money is being spent
2. **Optimized** - Continuously improve efficiency
3. **Accountable** - Assign cost ownership

### Tagging Strategy
```yaml
# Cost allocation tags
Tags:
  - Key: Environment
    Value: production|staging|development
  - Key: Application
    Value: myapp
  - Key: Team
    Value: platform
  - Key: Owner
    Value: platform@example.com
  - Key: CostCenter
    Value: CC-12345
  - Key: Project
    Value: migration
```

## Compute Optimization

### Right-Sizing EC2
```python
# Analyze and recommend right-sizing using Cost Explorer
import boto3

ce = boto3.client('ce')

# Get utilization data
response = ce.get_right_sizing_details(
    Filter={
        'And': [
            {'Dimensions': {'Key': 'SERVICE', 'Values': ['Amazon EC2']}},
            {'Tags': {'Key': 'Environment', 'Values': ['production']}}
        ]
    },
    NextPageToken='string'
)

for instance in response['RightSizingDetails']:
    print(f"Instance: {instance['ResourceId']}")
    print(f"Current: {instance['CurrentInstance']['InstanceType']}")
    print(f"Recommendation: {instance['TargetInstanceType']}")
    print(f"Estimated Savings: {instance['EstimatedMonthlySavings']}")
```

### Savings Plans vs Reserved Instances
```yaml
# Compute Savings Plan (AWS)
Resource:
  Type: AWS::CE::SavingsPlan
  Properties:
    SavingsPlanType: COMPUTE_SP
    PaymentOption: ALL_UPFRONT
    Term: THREE_YEARS
    Commitment: 5000 # $/hour commitment
    OfferingType: Standard

# Azure Reserved VM
Resource:
  Type: Microsoft.Compute/reservations
  Properties:
    reservedComputeYears: 3
    paymentBillingScope: Shared
    reservedVMs:
      - quantity: 5
        vmSize: Standard_D4s_v3
```

### Spot Instance Strategy
```yaml
# Spot Fleet with diversified allocation
Resources:
  SpotFleet:
    Type: AWS::EC2::SpotFleet
    Properties:
      SpotFleetRequestConfigData:
        AllocationStrategy: lowestPrice
        InstancePoolsToUseCount: 3
        IamFleetRole: !GetAtt SpotFleetRole.Arn
        TargetCapacity: 100
        LaunchSpecifications:
          - InstanceType: c5.large
            WeightedCapacity: 2
            SpotPrice: "0.10"
            ImageId: ami-12345678
          - InstanceType: c5.xlarge
            WeightedCapacity: 4
            SpotPrice: "0.20"
            ImageId: ami-12345678
```

## Storage Optimization

### S3 Lifecycle Policies
```yaml
# Intelligent Tiering + Glacier
Resources:
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: data-store
      LifecycleConfiguration:
        Rules:
          - Id: IntelligentTieringRule
            Status: Enabled
            Transitions:
              - Days: 0
                StorageClass: INTELLIGENT_TIERING
              - Days: 90
                StorageClass: STANDARD_IA
              - Days: 180
                StorageClass: GLACIER
              - Days: 365
                StorageClass: DEEP_ARCHIVE
          - Id: CleanupOldVersions
            Status: Enabled
            NoncurrentVersionTransitions:
              - Days: 30
                StorageClass: GLACIER
            NoncurrentVersionExpirationInDays: 365
```

### Database Cost Optimization
```sql
-- PostgreSQL Aurora - Serverless to Provisioned conversion
-- For predictable workloads
CREATE SCALING POLICY app_policy {
  MinCapacity: 2;
  MaxCapacity: 64;
  AutoPause: true;
  SecondsUntilAutoPause: 300;
};

-- For serverless:
-- Set min capacity to 0 during off-hours using Lambda + EventBridge
```

### Block Storage Optimization
```yaml
# GP3 instead of GP2 (20% cheaper, better performance)
Resources:
  Volume:
    Type: AWS::EC2::Volume
    Properties:
      Size: 100
      VolumeType: gp3
      Throughput: 125
      Iops: 3000
```

## Networking Optimization

### NAT Gateway vs NAT Instance
```yaml
# Cost comparison: NAT Gateway ~$0.045/GB + $0.045/hour
# NAT Instance: ~$0.01-0.02/hour for t3.micro + $0.005/GB
# For high traffic: NAT Gateway; Low traffic: NAT Instance

# VPC Endpoints to avoid NAT charges
Resources:
  S3Endpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: com.amazonaws.us-east-1.s3
      RouteTableIds:
        - !Ref PrivateRouteTable
      VpcEndpointType: Gateway
```

### Data Transfer Optimization
```yaml
# CloudFront for reduced origin traffic
Resources:
  Distribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        PriceClass: PriceClass_100  # Cheapest
        DefaultCacheBehavior:
          TargetOriginId: !Ref Origin
          ViewerProtocolPolicy: redirect-to-https
          Compress: true
          CachePolicyId: !Ref CachePolicy
```

## Kubernetes Cost Optimization

### Cluster Autoscaler + Karpenter
```yaml
# Karpenter provisioner
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  requirements:
    - key: node.kubernetes.io/instance-type
      operator: In
      values:
        - m5.large
        - m5.xlarge
    - key: topology.kubernetes.io/zone
      operator: NotIn
      values:
        - us-east-1a
  limits:
    resources:
      cpu: "100"
      memory: 500Gi
  provider:
    subnetSelector:
      karpenter.sh/discovery: production
  ttlSecondsAfterEmpty: 30
  ttlSecondsUntilExpired: 86400
```

### Resource Quotas
```yaml
# LimitRange for default limits
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
spec:
  limits:
    - max:
        cpu: "4"
        memory: 8Gi
      default:
        cpu: 250m
        memory: 512Mi
      defaultRequest:
        cpu: 100m
        memory: 256Mi
      type: Container
```

## Cost Monitoring

### Budget Alerts
```yaml
# AWS Budget
Resources:
  MonthlyBudget:
    Type: AWS::Budgets::Budget
    Properties:
      Budget:
        BudgetType: COST
        CostFilters:
          TagKeyValue:
            - aws:createdBy=CF
        BudgetLimit:
          Amount: "5000"
          Unit: USD
        TimeUnit: MONTHLY
        CostTypes:
          IncludeReservations: true
      NotificationsWithSubscribers:
        - Notification:
            ComparisonOperator: GREATER_THAN
            NotificationType: ACTUAL
            Threshold: 80
          Subscribers:
            - SubscriptionType: EMAIL
              Address: finance@example.com
```

### Cost Explorer Queries
```python
# Daily cost by service
response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': '2024-01-01',
        'End': '2024-01-31'
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost', 'UsageQuantity'],
    GroupBy=[
        {'Type': 'DIMENSION', 'Key': 'SERVICE'},
        {'Type': 'TAG', 'Key': 'Environment'}
    ]
)
```

## Reserved Capacity Planning

### Capacity Analysis
```python
# Analyze usage patterns for reservations
response = ce.get_anomaly_detection_configurations(
    MonitorArnList=['arn:aws:ce::123456789:anomaly-detector/123']
)

# Right-time purchasing
# 1. Analyze 14+ days of usage
# 2. Identify consistent base load
# 3. Purchase RIs for base, use On-Demand + Spot for variability
```

### Azure Reserved Capacity
```powershell
# Check reserved instance recommendations
Get-AzReservationRecommendation -ReservedQuantity 5
# Review savings potential before committing
```

## Best Practices Checklist

- [ ] Implement cost allocation tags
- [ ] Enable budget alerts and anomaly detection
- [ ] Use Savings Plans for compute
- [ ] Enable S3 Intelligent Tiering
- [ ] Use VPC endpoints for S3/DynamoDB
- [ ] Right-size EC2/VM instances
- [ ] Use Spot/Preemptible for fault-tolerant workloads
- [ ] Enable auto-scaling for production workloads
- [ ] Use CloudFront/CDN for static content
- [ ] Set up CUR (Cost and Usage Report) with Athena
- [ ] Create dashboards for cost visibility
- [ ] Schedule start/stop for non-production resources
- [ ] Review unused resources weekly
- [ ] Use serverless for variable workloads
- [ ] Enable compression and caching
