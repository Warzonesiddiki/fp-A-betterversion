---
name: ci-cd-pipeline-design
description: CI/CD pipeline design patterns including stages, parallelization, artifact management, deployment strategies (blue-green, canary), and quality gates.
origin: https://martinfowler.com/topics/cd4ml.html
---

# CI/CD Pipeline Design

## Pipeline Stages

### Typical Stages
1. **Checkout**: Clone repository
2. **Install**: Install dependencies
3. **Lint/Static Analysis**: Code quality checks
4. **Test**: Unit and integration tests
5. **Build**: Compile/package artifacts
6. **Security Scan**: Vulnerability scanning
7. **Deploy**: Deploy to environment
8. **Verify**: Smoke tests, health checks

### Stage Configuration
```yaml
stages:
  - name: test
    parallel: true
    jobs:
      - unit-tests
      - integration-tests
      - e2e-tests

  - name: build
    needs: [test]
    artifacts:
      paths:
        - dist/
        - coverage/
      expire_in: 7 days

  - name: deploy-staging
    needs: [build]
    environment: staging
    when: manual
```

## Deployment Strategies

### Blue-Green Deployment
- Run two identical environments
- Switch traffic at load balancer level
- Instant rollback capability

```yaml
deploy:
  strategy: blue-green
  blue:
    replicas: 3
    image: myapp:v2.1
  green:
    replicas: 3
    image: myapp:v2.0
  traffic:
    switch: after_health_check
```

### Canary Deployment
- Gradually shift traffic to new version
- Monitor metrics before full rollout

```yaml
deploy:
  strategy: canary
  steps:
    - weight: 10
      pause: 10m
    - weight: 50
      pause: 30m
    - weight: 100
```

### Rolling Deployment
```yaml
deploy:
  strategy: rolling
  maxSurge: 1
  maxUnavailable: 0
```

## Quality Gates

### Required Checks
```yaml
quality_gates:
  - name: unit-test-coverage
    threshold: 80%
    action: fail

  - name: security-scan
    critical_vulnerabilities: 0
    high_vulnerabilities: 0
    action: fail

  - name: code-coverage
    threshold: 70%
    action: warn
```

## Artifact Management

### Publish Artifacts
```yaml
build:
  script:
    - npm run build
  artifacts:
    name: "${CI_COMMIT_REF_NAME}-${CI_COMMIT_SHA}"
    paths:
      - dist/
      - coverage/
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## Environment Promotion

```yaml
promotion:
  - environment: development
    auto: true
    on:
      - branch: develop

  - environment: staging
    auto: false
    approval: required
    on:
      - tag: v*

  - environment: production
    auto: false
    approval: required
    on:
      - tag: v*[0-9]
```

## Best Practices

1. **Fail fast**: Run fastest tests first
2. **Parallel execution**: Split tests across runners
3. **Immutable artifacts**: Never rebuild between stages
4. **Secrets management**: Use vault or cloud secrets, never env vars in code
5. **Idempotent deployments**: Can run multiple times safely
6. **Comprehensive rollback**: Test your rollback path
7. **Monitoring integration**: Validate deployments with metrics
