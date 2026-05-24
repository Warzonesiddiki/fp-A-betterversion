---
name: gcp-cloud-patterns
description: Google Cloud Platform architecture patterns including Anthos, GKE, Cloud Run, serverless patterns, and multi-region deployments.
origin: https://cloud.google.com/architecture
---

# GCP Cloud Patterns

## GCP Architecture Overview

### Core Services
- **Compute**: Compute Engine, GKE, Cloud Run, App Engine, Cloud Functions
- **Storage**: Cloud Storage, Cloud SQL, Cloud Spanner, Bigtable, Firestore
- **Networking**: VPC, Cloud CDN, Cloud Load Balancing, Cloud Armor
- **Data**: BigQuery, Dataflow, Dataproc, Pub/Sub, Dataform

## Design Patterns

### Container-Native Pattern (GKE)
```yaml
# GKE Autopilot cluster
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: production-cluster
spec:
  location: us-central1
  autopilot:
    enabled: true
  workloadConfig:
    enableHeavyMigration: true
  networking:
    dnsConfig:
      clusterDns: CLOUD_DNS
  privateClusterConfig:
    enablePrivateNodes: true
    masterIpv4CidrBlock: 172.16.0.0/28
```

### Cloud Run Serverless Pattern
```yaml
# Cloud Run service
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: api-service
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "100"
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
  traffic:
  - latestRevision: true
    percent: 100
```

### Event-Driven with Pub/Sub
```python
# Cloud Functions with Pub/Sub trigger
from google.cloud import pubsub_v1

def process_event(event, context):
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(project_id, output_topic)
    
    message = {
        "event_id": context.event_id,
        "timestamp": context.timestamp,
        "data": base64.b64decode(event['data']).decode('utf-8')
    }
    
    publisher.publish(topic_path, json.dumps(message).encode('utf-8'))
```

### Microservices with Service Mesh (Anthos)
```
Global Load Balancer
       |
  Cloud Armor (WAF)
       |
  Istio Ingress Gateway
       |
  +----+----+----+
  |    |    |    |
API  Auth  User  Order
Gateway Service Service Service
  |      |      |      |
  +------+------+------+
         |
    Cloud Spanner
    (Globally consistent)
```

## Multi-Region Patterns

### Global Load Balancing
```yaml
# Global HTTP(S) Load Balancer
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: global-backend
spec:
  loadBalancingScheme: EXTERNAL_MANAGED
  protocol: HTTP
  timeoutSec: 30
  cloudRun:
    region: us-central1
```

### Disaster Recovery with Cloud SQL
```yaml
# Cloud SQL with HA configuration
apiVersion: sqladmin.cnrm.cloud.google.com/v1beta1
kind: SQLInstance
metadata:
  name: prod-db
spec:
  region: us-central1
  databaseVersion: POSTGRES_14
  settings:
    tier: db-n1-standard-4
    availabilityType: REGIONAL
    backupConfiguration:
      enabled: true
      startTime: "03:00"
      pointInTimeRecoveryEnabled: true
    ipConfiguration:
      ipv4Enabled: false
      privateNetworkRef:
        ref:
          name: vpc-network
```

## Serverless Patterns

### Cloud Functions (2nd gen)
```python
# Python function with CloudEvents
import functions_framework
from cloudevents.http import CloudEvent

@functions_framework.cloud_event
def handle_event(cloud_event: CloudEvent):
    data = cloud_event.data
    print(f"Received event: {data}")
    
    # Process with retry
    for attempt in range(3):
        try:
            process_message(data)
            break
        except Exception as e:
            if attempt == 2:
                raise
```

### App Engine Standard
```yaml
# app.yaml
runtime: python311
instance_class: F2
automatic_scaling:
  min_instances: 1
  max_instances: 20
  target_cpu_utilization: 0.7
  min_pending_latency: 30ms
  max_pending_latency: automatic
```

## Security Patterns

### Workload Identity
```yaml
# Kubernetes service account binding
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
---
apiVersion: v1
kind: Secret
metadata:
  name: google-application-credentials
  namespace: production
type: Opaque
stringData:
  service-account.json: |
    {"type": "service_account"...}
```

### VPC Service Controls
```yaml
# Security perimeter for BigQuery
apiVersion: accesscontextmanager.cnrm.cloud.google.com/v1beta1
kind: AccessContextManagerServicePerimeter
metadata:
  name: data-perimeter
spec:
  title: Data Services Perimeter
  perimeterType: REGULAR
  status:
    resources:
      - projects/123456
    accessLevels:
      - policies/security/policy/members
    restrictedServices:
      - bigquery.googleapis.com
      - storage.googleapis.com
```

## Anthos Patterns

### GitOps with Config Sync
```yaml
# RootSync configuration
apiVersion: configsync.gke.io/v1
kind: RootSync
metadata:
  name: root-sync
  namespace: config-management-system
spec:
  sourceFormat: hierarchical
  git:
    repo: https://github.com/org/config-repo
    branch: main
    dir: .
    revision: HEAD
```

### Policy Controller
```yaml
# Constrain pod security
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: require-namespace-labels
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Namespace"]
  parameters:
    labels:
      - key: environment
      - key: team
```

## MCP Server Integration

Use these MCP servers for GCP operations:
- **GCP MCP Server**: Resource management and queries
- **kubectl**: GKE cluster management
- **Kubernetes**: Multi-cluster operations

## Best Practices Checklist

- [ ] Enable VPC firewall rules
- [ ] Use private Google Access
- [ ] Configure Cloud NAT for egress
- [ ] Enable VPC Flow Logs
- [ ] Set up Cloud Armor policies
- [ ] Implement Secret Manager
- [ ] Enable Binary Authorization for GKE
- [ ] Configure Cloud Logging sink
