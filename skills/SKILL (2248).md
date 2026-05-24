---
name: multi-cloud-strategy
description: Multi-cloud architecture patterns including AWS, Azure, GCP interoperability, unified management, and portability best practices.
origin: https://cloud.google.com/solutions/multi-cloud-architecture
---

# Multi-Cloud Strategy

## Architecture Principles

### Portability Goals
1. **Abstraction** - Abstract cloud-specific services
2. **Containerization** - Use containers for portability
3. **Infrastructure as Code** - Terraform for multi-cloud
4. **API Compatibility** - Design for portability
5. **Unified Observability** - Single pane of glass

### Reference Architecture
```
                    ┌─────────────────────────────────────────┐
                    │           Control Plane                  │
                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
                    │  │ Terraform│  │ Ansible │  │ Pulumi  │ │
                    │  └─────────┘  └─────────┘  └─────────┘ │
                    └─────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│     AWS        │           │    Azure       │           │     GCP        │
│   ┌─────────┐ │           │   ┌─────────┐ │           │   ┌─────────┐ │
│   │   EKS   │ │           │   │   AKS   │ │           │   │   GKE   │ │
│   │ Cluster │ │           │   │ Cluster │ │           │   │ Cluster │ │
│   └─────────┘ │           │   └─────────┘ │           │   └─────────┘ │
│   ┌─────────┐ │           │   ┌─────────┐ │           │   ┌─────────┐ │
│   │   S3    │ │◄──────────►│   │   Blob  │ │◄─────────►│   │   GCS   │ │
│   └─────────┘ │           │   └─────────┘ │           │   └─────────┘ │
│   ┌─────────┐ │           │   ┌─────────┐ │           │   ┌─────────┐ │
│   │  Lambda │ │           │   │Funciones│ │           │   │Functions│ │
│   └─────────┘ │           │   └─────────┘ │           │   └─────────┘ │
└───────────────┘           └───────────────┘           └───────────────┘
```

## Terraform Multi-Cloud

### Provider Configuration
```hcl
# terraform/providers.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "global/terraform.tfstate"
    region = "us-east-1"
  }
}

# providers.tf
provider "aws" {
  alias   = "aws-primary"
  region  = var.aws_primary_region
}

provider "aws" {
  alias   = "aws-dr"
  region  = var.aws_dr_region
}

provider "azurerm" {
  alias           = "azure-primary"
  subscription_id = var.azure_subscription_id
  features {}
}

provider "google" {
  alias = "gcp-primary"
  project = var.gcp_project
  region  = var.gcp_region
}
```

### Module Structure
```
modules/
├── networking/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── kubernetes/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── databases/
    ├── main.tf
    ├── variables.tf
    └── outputs.tf

environments/
├── production/
│   ├── main.tf
│   ├── providers.tf
│   └── terraform.tfvars
├── staging/
└── development/
```

### Network Module Example
```hcl
# modules/networking/main.tf

# AWS VPC
resource "aws_vpc" "main" {
  count      = var.provider == "aws" ? 1 : 0
  cidr_block = var.cidr_block
  tags       = var.tags
}

# Azure Virtual Network
resource "azurerm_virtual_network" "main" {
  count               = var.provider == "azure" ? 1 : 0
  address_space       = [var.cidr_block]
  location            = var.location
  resource_group_name = var.resource_group
  tags                = var.tags
}

# GCP VPC
resource "google_compute_network" "main" {
  count                   = var.provider == "gcp" ? 1 : 0
  name                    = var.name
  auto_create_subnetworks = false
}
```

## Kubernetes Multi-Cloud

### Cluster Management with Terraform
```hcl
# Kubernetes clusters on all providers
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  providers = {
    aws = aws.aws-primary
  }
  
  cluster_name    = "prod-cluster"
  cluster_version = "1.28"
  subnet_ids      = module.vpc.aws_subnet_ids
  
  eks_managed_node_groups = {
    general = {
      min_size       = 3
      max_size       = 10
      instance_types = ["m5.large"]
    }
  }
}

module "aks" {
  source  = "Azure/aks-module/azurerm"
  version = "~> 7.0"
  
  providers = {
    azurerm = azurerm.azure-primary
  }
  
  cluster_name    = "prod-cluster"
  resource_group  = azurerm_resource_group.main.name
  location        = var.azure_region
  agent_count     = 3
  vm_size         = "Standard_D2s_v3"
}

module "gke" {
  source  = "GoogleCloudPlatform/kubernetes-engine/google"
  version = "~> 28.0"
  
  providers = {
    google = google.gcp-primary
  }
  
  project_id  = var.gcp_project
  name        = "prod-cluster"
  region      = var.gcp_region
  network     = google_compute_network.main.name
  subnetwork  = google_compute_subnetwork.main.name
}
```

### Cluster Federation with KubeFed
```yaml
# KubeFed configuration
apiVersion: core.kubefed.io/v1beta1
kind: KubeFedConfig
metadata:
  name: kubefed
  namespace: kube-federation-system
spec:
  scope: Namespaced
  controllerDuration:
    availableDelay: 20m
    unavailableDelay: 60s
  leaderElector:
    leaseDuration: 15s
    renewDeadline: 10s
    retryPeriod: 5s
    resourceLock: configmaps
  featureGates:
    - name: PushReconciler
      configuration: Enabled
    - name: SchedulerPreferences
      configuration: Enabled
```

## Service Mesh (Multi-Cloud)

### Istio Multi-Cluster
```yaml
# Istio control plane mesh federation
apiVersion: mesh.federation.io/v1alpha1
kind: MeshConfig
metadata:
  name: main-mesh
spec:
  meshMTLS:
    enabled: true
  localityLbSetting:
    enabled: true
  defaultConfig:
    envoyMetricsService:
      address: metrics-collector.observability:15090
    envoyAccessLogService:
      address: metrics-collector.observability:15090
```

### Cross-Cluster Service Discovery
```yaml
# Service export across clusters
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceExport
metadata:
  name: my-service
  namespace: production
spec:
  clusterName: aws-cluster-1
---
apiVersion: multicluster.x-k8s.io/v1alpha1
kind: ServiceImport
metadata:
  name: my-service
  namespace: production
spec:
  clusters:
    - name: aws-cluster-1
    - name: gcp-cluster-1
  type: ClusterSetIP
```

## Unified Observability

### OpenTelemetry Collector
```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'kubernetes-pods'
          kubernetes_sd_configs:
            - role: pod

exporters:
  otlp:
    endpoint: "ingestion.example.com:4317"
    tls:
      insecure: false
      cert_file: /etc/otel/certs/client.crt
      key_file: /etc/otel/certs/client.key
  
  prometheusremotewrite:
    endpoint: "https://prometheus.example.com/api/v1/write"
    external_labels:
      environment: production
      cloud: multi

processors:
  batch:
    timeout: 10s
  resource:
    attributes:
      - action: upsert
        key: cloud.provider
        value: ${CLOUD_PROVIDER}

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [otlp]
    metrics:
      receivers: [prometheus]
      processors: [batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [otlp]
```

## Data Portability

### Cross-Cloud Storage Abstraction
```python
# storage_interface.py
from abc import ABC, abstractmethod

class CloudStorage(ABC):
    @abstractmethod
    def upload(self, bucket: str, key: str, data: bytes) -> str:
        pass
    
    @abstractmethod
    def download(self, bucket: str, key: str) -> bytes:
        pass
    
    @abstractmethod
    def list_objects(self, bucket: str, prefix: str = "") -> list:
        pass

class S3Storage(CloudStorage):
    def __init__(self, region: str):
        self.s3 = boto3.client('s3', region_name=region)
    
    def upload(self, bucket: str, key: str, data: bytes) -> str:
        self.s3.put_object(Bucket=bucket, Key=key, Body=data)
        return f"s3://{bucket}/{key}"

class GCSStorage(CloudStorage):
    def __init__(self, project: str):
        self.gcs = storage.Client(project=project)
    
    def upload(self, bucket: str, key: str, data: bytes) -> str:
        bucket = self.gcs.bucket(bucket)
        blob = bucket.blob(key)
        blob.upload_from_string(data)
        return f"gs://{bucket}/{key}"
```

## Security in Multi-Cloud

### Unified Identity
```yaml
# External Secrets with AWS Secrets Manager as backend
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: prod/database
        property: password
---
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secretsmanager
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

## Best Practices

1. **Use abstraction layers** - Don't couple to vendor APIs
2. **Standardize on containers** - Docker/OCI images everywhere
3. **Infrastructure as Code** - Terraform for all clouds
4. **Unified networking** - VPN or Direct Connect for hybrid
5. **Centralized logging** - Aggregate across all clouds
6. **Use service mesh** - Istio for cross-cluster traffic
7. **Implement secrets management** - External Secrets Operator
8. **Document differences** - Map cloud-specific features
9. **Plan for failure** - Design for cloud outages
10. **Cost visibility** - Tag and track across all providers
