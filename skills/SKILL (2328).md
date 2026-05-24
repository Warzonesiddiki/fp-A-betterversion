---
name: security-best-practices-devops
description: DevOps security practices including secrets management, container security, supply chain security, IAM best practices, and compliance automation.
origin: https://owasp.org/www-project-devsecops-maturity-model/
---

# Security Best Practices for DevOps

## Secrets Management

### Never Commit Secrets
```bash
# .gitignore
.env
*.pem
*.key
credentials.json
secrets.yaml

# Pre-commit hook to prevent accidental commits
#!/bin/bash
if git diff --cached --name-only | grep -E "\.(env|yaml|json)$"; then
  echo "Secrets files cannot be committed"
  exit 1
fi
```

### Vault Patterns
```hcl
# HashiCorp Vault dynamic secrets
resource "vault_aws_access_credentials" "db-creds" {
  backend = "aws"
  role    = "db-role"
  
  depends_on = [vault_policy.db-policy]
}

# Kubernetes external secrets
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: db-creds
  data:
    - secretKey: password
      remoteRef:
        key: secret/db
        property: password
```

## Container Security

### Scan and Sign Images
```yaml
# CI pipeline security checks
security_scan:
  stage: build
  
  scan_jobs:
    - name: trivy_scan
      script: |
        trivy image --exit-code 1 --severity HIGH,CRITICAL myapp:latest
        
    - name: sigstore_sign
      script: |
        cosign sign --yes myregistry/myapp:latest
        
    - name: sbom_generate
      script: |
        syft myapp:latest -o cyclonedx-json > sbom.json
```

### Runtime Security
```yaml
# Kubernetes Pod Security Standards
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
```

## Supply Chain Security

### SBOM and Provenance
```bash
# Generate SBOM
syft myapp:latest -o spdx-json > myapp-bom.spdx.json

# Sign and verify with Sigstore
cosign sign --yes ghcr.io/myorg/myapp:latest
cosign verify ghcr.io/myorg/myapp:latest

# Verify with attestation
cosign verify-attestation --type cyclonedx \
  ghcr.io/myorg/myapp:latest
```

### Dependency Scanning
```yaml
# GitHub Dependabot
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10
    reviewers:
      - security-team
    commit-message:
      prefix: "deps"
```

## IAM Best Practices

### Least Privilege
```hcl
# Terraform IAM policy
data "aws_iam_policy_document" "instance" {
  statement {
    sid    = "S3ReadOnly"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ]
    resources = [
      "arn:aws:s3:::read-only-bucket/*"
    ]
  }
  
  statement {
    sid    = "DynamoDBOnlyTable"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem"
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:123456789:table/${var.table_name}"
    ]
  }
}
```

### Service Control Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PreventRegion",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1", "eu-west-1"]
        }
      }
    }
  ]
}
```

## Network Security

### Zero Trust Architecture
```yaml
# Kubernetes Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              role: frontend
      ports:
        - port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              role: database
      ports:
        - port: 5432
```

## Compliance Automation

### Policy as Code
```yaml
# OPA Rego policy
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  input.request.object.spec.containers[_].securityContext.privileged == true
  msg = "Privileged containers are not allowed"
}

deny[msg] {
  input.request.kind.kind == "Pod"
  not input.request.object.spec.securityContext.runAsNonRoot
  msg = "Pods must run as non-root"
}
```

## Best Practices

1. **Shift left security**: Integrate security in development, not just production
2. **Automate security scanning**: In CI/CD pipelines
3. **Use ephemeral credentials**: Short-lived, rotated frequently
4. **Encrypt everything**: Data at rest and in transit
5. **Audit everything**: Comprehensive logging and monitoring
6. **Defense in depth**: Multiple layers of security
7. **Regular updates**: Keep dependencies and base images current
8. **Incident response plan**: Document and practice security incidents
