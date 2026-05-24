---
name: secrets-management
description: Enterprise secrets management patterns including secret rotation, vault architecture, environment-based secrets, and integration with CI/CD pipelines.
triggers:
  - /secrets
  - /secret-management
  - /credentials
  - /api-keys
useCases:
  - "Setting up HashiCorp Vault"
  - "Rotating database credentials"
  - "CI/CD secrets integration"
  - "Managing API keys securely"
tags:
  - security
  - secrets
  - devops
  - vault
---

# Secrets Management

## Core Principles

```yaml
secrets_do:
  - Rotate frequently (30-90 days)
  - Use least privilege access
  - Store in dedicated secrets manager
  - Audit all access attempts
  - Use encryption at rest and in transit

secrets_dont:
  - Commit to git (ever)
  - Hardcode in source code
  - Log or display in output
  - Share via Slack/email
  - Store in Docker images
```

## Secret Types & Handling

| Secret Type | Example | Rotation | Storage |
|-------------|---------|----------|---------|
| Database Passwords | PostgreSQL creds | 30 days | Vault |
| API Keys | Stripe, AWS | 90 days | Vault |
| SSH Keys | Server access | 180 days | Vault + HSM |
| Certificates | TLS certs | 90 days | Vault PKI |
| Encryption Keys | AES-256 | 365 days | HSM |
| Tokens | JWT signing | 1 hour | Memory only |

## Vault Architecture

### HashiCorp Vault Setup

```yaml
# config.hcl
storage "raft" {
  path = "/var/vault/data"
  node_id = "node1"
}

listener "tcp" {
  address     = "[::]:8200"
  cluster_address = "[::]:8201"
  tls_disable = "false"
  tls_cert_file = "/certs/vault.crt"
  tls_key_file = "/certs/vault.key"
}

api_addr = "https://vault.internal:8200"
cluster_addr = "https://vault.internal:8201"

seals "pkcs11" {
  module  = "/usr/lib/pkcs11/libCryptoki2_64.so"
  slot    = "0"
  pin     = "/etc/vault/pin"
}

disable_mlock = true
ui = true
max_request_duration = "90s"
```

### Dynamic Secrets

```bash
# Enable secrets engines
vault secrets enable -path=aws aws
vault secrets enable -path=kv kv-v2
vault secrets enable -path=database database

# Database dynamic credentials
vault read database/roles/my-role
vault read database/creds/my-role  # Returns lease

# AWS dynamic credentials
vault read aws/roles/my-role
vault write aws/sts/my-role ttl=1h
```

### Kubernetes External Secrets

```yaml
# external-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: db-creds
    creationPolicy: Owner
  data:
    - secretKey: username
      remoteRef:
        key: prod/database/credentials
        property: username
    - secretKey: password
      remoteRef:
        key: prod/database/credentials
        property: password
```

## Environment-Based Secrets

### Local Development

```bash
# .env.local (never commit)
DATABASE_URL=postgres://user:pass@localhost:5432/dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-256-bit-secret-here
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# .env.example (commit this version)
DATABASE_URL=postgres://localhost:5432/dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
```

### Python Configuration

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    redis_url: str  
    jwt_secret: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch secrets
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.internal:8200
          caCertificate: ${{ secrets.VAULT_CA }}
          cert: ${{ secrets.VAULT_CLIENT_CERT }}
          key: ${{ secrets.VAULT_CLIENT_KEY }}
          secrets: |
            secret/data/ci/aws access_key_id | AWS_ACCESS_KEY_ID ;
            secret/data/ci/aws secret_access_key | AWS_SECRET_ACCESS_KEY ;
            secret/data/ci/dockerhub token | DOCKER_TOKEN ;
      
      - name: Configure AWS
        run: |
          aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
          aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
          
      - name: Build and Deploy
        run: ./scripts/deploy.sh
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

variables:
  VAULT_ADDR: https://vault.internal:8200

build:
  stage: build
  image: docker:latest
  before_script:
    - apk add --no-cache curl jq
    - DOCKER_AUTH=$(curl -s -X POST $VAULT_ADDR/v1/auth/approle/login \
        -d "role_id=$CI_JOB_ID&secret_id=$CI_JOB_SECRET")
    - export DOCKER_TOKEN=$(echo $DOCKER_AUTH | jq -r .auth.client_token)
  script:
    - docker login -u gitlab-ci -p $DOCKER_TOKEN
    - docker build -t $IMAGE:latest .
    - docker push $IMAGE:latest
```

## Secret Rotation Strategies

### Database Credentials

```python
import asyncio
from hvac import Client

class SecretRotator:
    def __init__(self, vault_addr: str, approle_id: str, approle_secret: str):
        self.client = Client(url=vault_addr)
        self.client.auth.approle.login(approle_id, approle_secret)
    
    async def rotate_database_creds(self, db_name: str, username: str):
        # 1. Generate new credentials
        creds = self.client.secrets.database.generate_credentials(
            mount_point='database',
            name=f'{db_name}-role'
        )
        
        # 2. Update database with new password
        await self.update_db_password(username, creds['password'])
        
        # 3. Update vault with new version
        self.client.secrets.kv.v2.create_or_update_secret(
            path=f'db/{db_name}',
            secret=dict(
                username=creds['username'],
                password=creds['password'],
                rotated_at=datetime.utcnow().isoformat()
            )
        )
        
        # 4. Notify dependent services
        await self.notify_rotation_complete(db_name)
```

## Secret Discovery

```bash
# GitRob - Find secrets in GitHub
gitrob track_organization my-org --github-access-token=$GITHUB_TOKEN

# TruffleHog - Scan repos
trufflehog filesystem ./ --json --no-update | jq '.strings_found[]'

# Detect Secrets
detect-secrets scan --base64-limit 5 --scan-all-files

# Gitleaks
gitleaks detect --source . --report-format json --report-path findings.json
```

## Emergency Response

```yaml
incident_response:
  compromised_secret:
    steps:
      - name: "Revoke immediately"
        cmd: "vault lease revoke -prefix secret/data/compromised"
      - name: "Rotate related secrets"
        cmd: "./scripts/rotate_related.sh"
      - name: "Force logout all sessions"
        cmd: "vault lease revoke -prefix auth/token/"
      - name: "Notify security team"
        cmd: "curl -X POST $SLACK_WEBHOOK -d 'Secret compromised: $SECRET_ID'"
      - name: "Document incident"
        cmd: "create-incident-report.sh"
```

## Audit Logging

```bash
# Enable audit logging
vault audit enable file file_path=/var/log/vault/audit.log
vault audit enable socket socket_type=tcp address=tcp://siem.internal:9090

# Query audit logs
vault list sys/audit
vault read sys/audit/file
vault read sys/mounts

# Monitor for anomalies
grep "Failed login" /var/log/vault/audit.log | wc -l
jq 'select(.auth || .client_token) | select(.auth.err != null)' audit.log
```
```
