---
name: sast-security-scanning
description: |
  Static Application Security Testing (SAST) configuration and workflows. Semgrep, SonarQube,
  and CodeQL integration for automated vulnerability detection, custom security rules,
  compliance enforcement (PCI-DSS, SOC 2, OWASP), and CI/CD security gates.
origin: MCP Market
---

# SAST Security Scanning

Comprehensive patterns for implementing Static Application Security Testing (SAST) workflows to automate vulnerability detection within the development lifecycle.

## When to Activate

- Setting up automated security scanning for new or existing codebases
- Integrating security quality gates into CI/CD pipelines
- Creating custom security rules for organization-specific vulnerabilities
- Enforcing compliance policies (PCI-DSS, SOC 2, OWASP)
- Tuning false positives in security scans
- Performing security audits before releases

## SAST Tool Overview

| Tool | Language Support | Best For |
|------|------------------|----------|
| Semgrep | Many (JS, TS, Python, Go, Rust, etc.) | Custom rules, fast scanning |
| CodeQL | Many + deep data flow | Complex vulnerabilities, security research |
| SonarQube | 20+ languages | Technical debt, quality gates |
| Checkmarx | Multiple | Enterprise compliance |
| Snyk Code | Multiple | Cloud-native security |

## Semgrep Patterns

### Installation and Configuration

`ash
# Install Semgrep
pip install semgrep

# or with npm
npm install -g semgrep

# Verify installation
semgrep --version
`

`yaml
# semgrep.yml
rules:
  - id: detect-sql-injection
    patterns:
      - pattern-inside: |
          db.query(\, ...)
      - pattern-not: |
          db.query(\"SELECT ...\", [...])
    message: Potential SQL injection detected
    severity: ERROR
    languages:
      - python
    metadata:
      cwe: 89
      owasp: A1
      category: security
`

### Common Security Rules

`yaml
# semgrep-rules/security/sql-injection.yml
rules:
  # SQL Injection - Python
  - id: python-sql-injection
    patterns:
      - pattern: |
          cursor.execute(f\"SELECT * FROM users WHERE id = {\}\")
    message: |
      Detected SQL injection vulnerability. Use parameterized queries instead.
    severity: ERROR
    languages: [python]
    metadata:
      cwe: 89
      owasp: A1

  # Hardcoded Secrets
  - id: hardcoded-secret
    patterns:
      - pattern-inside: |
          API_KEY = \"\\"
          PASSWORD = \"\\"
      - pattern-regex: '[A-Za-z0-9+/]{32,}=='
    message: Hardcoded secrets detected. Use environment variables.
    severity: ERROR
    languages: [python, javascript, typescript]
    metadata:
      cwe: 798
`

### Advanced Pattern Matching

`yaml
# Data flow analysis for authentication bypass
rules:
  - id: auth-bypass-data-flow
    mode: taint
    message: Unvalidated user input reaches sensitive operation
    severity: ERROR
    languages: [python]
    pattern-sources:
      - pattern: request.args.get(\)
    pattern-sinks:
      - pattern: eval(\)
      - pattern: exec(\)
    sanitize:
      - pattern: re.match(\, \)
`

## SonarQube Configuration

### Project Configuration

`yaml
# sonar-project.properties
sonar.projectKey=my-project
sonar.projectName=My Application
sonar.projectVersion=1.0

sonar.sources=src
sonar.tests=tests

# Security hot spots (critical vulnerabilities)
sonar.security.expected=RULES_SQALE_RATING_A

# Exclusions
sonar.exclusions=**/node_modules/**,**/*.test.ts
`

### CI/CD Integration

`yaml
# .github/workflows/sonarqube.yml
name: SonarQube Security Scan

on: [push, pull_request]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${ secrets.SONAR_HOST_URL }}
`

## CodeQL Patterns

### Database Setup

`ash
# Install CodeQL CLI
brew install codeql

# Create database for analysis
codeql database create --language=javascript-typescript /codeql-db/javascript

# Run queries
codeql database analyze /codeql-db/javascript security-queries.ql --format=sarif-latest
`

### Custom Security Queries

`sql
// Security/Injection/CustomInjection.qll
import javascript

from CallExpr call
where
  call.getCallee().(GlobalVarAccess).getName() = \"query\"
select call, \"Potential SQL injection without sanitization\"
`

## CI/CD Integration

### GitHub Actions Security Gate

`yaml
# .github/workflows/security-scan.yml
name: Security Scans

on: [push, pull_request]

jobs:
  semgrep:
    name: Semgrep Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install semgrep
      - run: semgrep ci
        env:
          SEMGREP_APP_TOKEN: ${ secrets.SEMGREP_APP_TOKEN }}

  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript, python
      - uses: github/codeql-action/analyze@v2
`

## Compliance Mapping

### OWASP Top 10 Mapping

| OWASP Category | Severity | CWE | Description |
|----------------|----------|-----|-------------|
| A01 Injection | ERROR | 89 | SQL, NoSQL, OS injection |
| A02 Auth Failure | ERROR | 287 | Broken authentication |
| A03 Data Exposure | WARNING | 200 | Sensitive data exposure |
| A04 XXE | ERROR | 611 | XML external entities |
| A05 BAC | ERROR | 639 | Broken access control |
| A06 Security Config | WARNING | 16 | Security misconfiguration |
| A07 XSS | WARNING | 79 | Cross-site scripting |
| A08 Deserialization | ERROR | 502 | Insecure deserialization |
| A09 Components | WARNING | 1104 | Known vulnerabilities |
| A10 Logging | WARNING | 778 | Insufficient monitoring |

### PCI-DSS Requirements

`yaml
# pci-dss.yml
compliance:
  standard: PCI-DSS 4.0
  
  requirements:
    - id: PCI-6.3.3
      description: Applications protected against known attacks
      rules:
        - sql-injection
        - xss
        
    - id: PCI-11.3.1
      description: Annual vulnerability scanning
      tools:
        - semgrep
        - sonarqube
`

## False Positive Management

### Tuning Strategies

`yaml
# semgrep.ignore.yml
rules:
  - id: python-sql-injection
    paths:
      - tests/           # Exclude test files
      - migrations/      # Exclude migration scripts
`

### Suppression Patterns

`python
# nosemgrep: python.lang.security.audit.insecure-hash-sha1
import hashlib
hashlib.sha1(data).hexdigest()
`

## Security Gate Thresholds

`yaml
# Quality Gate Definition
qualityGate:
  name: Security Standards
  
  conditions:
    - metric: new_vulnerabilities.critical
      operator: equals
      value: 0
      
    - metric: new_vulnerabilities.high
      operator: less_than
      value: 5
      
    - metric: coverage
      operator: greater_than
      value: 80
`

## Quick Reference

| Command | Description |
|---------|-------------|
| semgrep scan --config=auto | Scan with auto-detected rules |
| semgrep ci | Run in CI mode with baseline |
| codeql database analyze | Run CodeQL analysis |
| sonar-scanner | Run SonarQube scan |
| semgrep --config=p/security | Use security-focused rules |
