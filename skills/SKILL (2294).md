---
name: security-audit-workflow
description: Systematic security audit workflows for codebases, infrastructure, and systems. Covers planning, execution, reporting, and remediation tracking for comprehensive security assessments.
triggers:
  - /security-audit
  - /audit
  - /security-review
  - /compliance-audit
useCases:
  - "Performing security audit on codebase"
  - "Compliance review for regulations"
  - "Third-party security assessment"
  - "Post-incident security review"
tags:
  - security
  - audit
  - compliance
  - assessment
---

# Security Audit Workflow

## Pre-Audit Planning

### Scope Definition
```
1. Identify assets to audit (code, infra, configs, docs)
2. Define audit boundaries and exclusions
3. Determine compliance requirements (SOC2, HIPAA, GDPR, PCI)
4. Establish timeline and deliverables
5. Get stakeholder sign-off
```

### Risk-Based Prioritization
| Priority | Asset Category | Audit Frequency |
|----------|-----------------|-----------------|
| Critical | Authentication, payment, PII | Monthly |
| High | API endpoints, data stores | Quarterly |
| Medium | Internal tools, configs | Semi-annually |
| Low | Documentation, static assets | Annually |

## Audit Execution

### Phase 1: Reconnaissance
```bash
# Gather asset inventory
find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.go" \) | wc -l
git log --oneline -100 | head -20

# Infrastructure inventory
aws ec2 describe-instances --region us-east-1
kubectl get all --all-namespaces
terraform show
```

### Phase 2: Vulnerability Identification

#### Code Analysis
```python
# Static analysis patterns
SECURITY_PATTERNS = {
    "hardcoded_secrets": r'[A-Za-z0-9]{20,}==',  # Base64 encoded
    "sql_injection": r'execute\([^)]*%\(',  # String formatting in SQL
    "xss": r'innerHTML\s*=|outerHTML\s*=',  # Direct DOM manipulation
    "path_traversal": r'open\([^)]*\+|os\.path\.join\([^)]*\.\.',  # Unsafe file ops
}
```

#### Configuration Review
```yaml
# Check for misconfigurations
security_checks:
  - Check: "No default credentials in configs"
  - Check: "HTTPS enforced in production"
  - Check: "Secrets not in git history"
  - Check: "Firewall rules follow least privilege"
  - Check: "Logging captures security events"
  - Check: "Rate limiting on public endpoints"
```

### Phase 3: Penetration Testing (Light)

#### Common Attack Surfaces
```bash
# Check for common vulnerabilities
nmap -sV target.com  # Version scanning
nikto -h target.com  # Web server scanning
sqlmap -u "http://target.com/?id=1" --batch  # SQL injection
ffuf -w wordlist.txt -u "http://target.com/FUZZ"  # Directory fuzzing
```

### Phase 4: Report Generation

## Audit Report Template

```markdown
# Security Audit Report

## Executive Summary
[High-level findings and risk posture]

## Scope
[Systems, code, time period covered]

## Findings

### Critical
| ID | Finding | Impact | Remediation |
|----|---------|--------|-------------|
| C-01 | [Title] | [Risk] | [Fix] |

### High
### Medium
### Low
### Informational

## Recommendations
1. Immediate actions
2. Short-term (30 days)
3. Long-term (90+ days)

## Appendices
- Raw scan results
- Evidence screenshots
- Tool versions used
```

## Remediation Tracking

```yaml
remediation_tracker:
  finding_C01:
    status: in_progress
    assigned_to: dev-team
    due_date: 2024-01-15
    verification: penetration_test
```

## Tools Reference

| Tool | Purpose | Use Case |
|------|---------|----------|
| Semgrep | Static analysis | Code vulnerabilities |
| Trivy | Container scanning | Image vulnerabilities |
| Burp Suite | Web testing | API vulnerabilities |
| OWASP ZAP | Automated scanning | Web app testing |
| Nuclei | Template scanning | Infrastructure issues |

## Post-Audit Activities

1. **Remediation verification** - Re-scan after fixes
2. **Lessons learned** - Document improvements
3. **Update security baseline** - Track progress
4. **Schedule follow-up** - Confirm closure

## Compliance Mapping

```yaml
compliance_frameworks:
  SOC2:
    - CC1.1: Security policies
    - CC6.1: Logical access controls
  GDPR:
    - Art 32: Security of processing
    - Art 33: Breach notification
  PCI-DSS:
    - Req 6.3: Vulnerabilities managed
    - Req 10: Logging/monitoring
```
