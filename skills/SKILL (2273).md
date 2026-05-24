---
name: vulnerability-assessment
description: Systematic vulnerability assessment methodology, scanning tools, risk prioritization, and remediation planning for identifying and managing security vulnerabilities.
triggers:
  - /vuln-scan
  - /vulnerability-scan
  - /assess-vulns
  - /cve-check
useCases:
  - "Running vulnerability scans"
  - "Prioritizing CVE remediation"
  - "Assessing application vulnerabilities"
  - "Third-party risk assessment"
tags:
  - security
  - vulnerability
  - cve
  - scanning
  - risk-assessment
---

# Vulnerability Assessment

## Assessment Lifecycle

```yaml
assessment_phases:
  discovery:
    duration: "Week 1"
    activities:
      - Asset inventory
      - Network mapping
      - Service identification
      - Configuration review
      
  scanning:
    duration: "Week 2"
    activities:
      - Automated scans
      - Manual testing
      - False positive elimination
      - Evidence collection
      
  analysis:
    duration: "Week 3"
    activities:
      - Risk scoring (CVSS)
      - Impact assessment
      - Exploitability analysis
      - Business context
      
  remediation:
    duration: "Ongoing"
    activities:
      - Prioritization
      - Fix planning
      - Implementation
      - Verification
```

## Asset Discovery

### Infrastructure Inventory

```bash
# Network scanning
nmap -sn -oA inventory 10.0.0.0/24
masscan -p1-65535 10.0.0.0/24 --rate=10000 -oJ scan.json

# Cloud asset discovery
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,Tags,State]'
gcloud compute instances list --format=json
az vm list --resource-group --output table

# Container scanning
trivy image --input container.tar --format json --output scan.json

# Kubernetes security scan
kubesec scan deployment.yaml
kube-bench run --target master
```

### Application Enumeration

```python
# Web application fingerprinting
import httpx

TECHNOLOGY_STACK = {
    "headers": ["X-Powered-By", "X-AspNet-Version"],
    "cookies": ["ASP.NET_SessionId", "PHPSESSID", "JSESSIONID"],
    "html": ["<input[^>]*name=\"__VIEWSTATE\"", "React", "Angular"],
    "scripts": ["/static/js/app*.js", "/assets/application*.js"],
}

def fingerprint_app(url: str) -> dict:
    response = httpx.get(url)
    findings = {
        "server": response.headers.get("Server", "Unknown"),
        "tech_stack": [],
        "frameworks": [],
    }
    
    # Check headers
    for tech, pattern in TECHNOLOGY_STACK.items():
        if any(p in str(response.headers) for p in pattern):
            findings["tech_stack"].append(tech)
    
    return findings
```

## Vulnerability Scanning

### Network Scanning

```bash
# Nmap vulnerability scanning
nmap --script vuln -sV -p- target.com -oA vuln_scan

# Specific CVE checks
nmap --script http-cve -p 80,443 target.com
nmap --script smb-vuln* -p 445 target.com
nmap --script ssl-enum-ciphers -p 443 target.com

# OpenVAS/Nessus equivalent with Nmap
nmap --script auth,brute,discovery,exploit,vuln -sV target.com
```

### Web Application Scanning

```bash
# Nikto web scanning
nikto -h https://target.com -o nikto_report.json -Format json

# OWASP ZAP automated scan
zap-baseline.py -t https://target.com -J zap_report.json

# SQLMap automated injection testing
sqlmap -u "https://target.com/search?q=test" --batch --dbs
sqlmap -u "https://target.com/api/users/1" --batch --level=5

# Custom wordlist fuzzing
ffuf -w /usr/share/wordlists/dirb/common.txt -u "https://target.com/FUZZ" \
     -mc 200,204,301,302,307,401,403 -o fuzz_results.json
```

### Container & Kubernetes Scanning

```bash
# Trivy container scanning
trivy image --severity HIGH,CRITICAL myapp:latest --output scan.json
trivy fs --security-checks vuln,config,secret ./project/

# Grype
grype dir:./myapp --output json --file scan_results.json

# Kubernetes audit
kubectl audit-resources --all-namespaces --filter-kind Deployment

# Check for vulnerable images in cluster
kubectl get pods -o json | jq -r '.items[].spec.containers[].image'
```

## CVE Analysis

### CVSS Scoring

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class CVSSVector:
    attack_vector: str  # Network, Adjacent, Local, Physical
    attack_complexity: str  # Low, High
    privileges_required: str  # None, Low, High
    user_interaction: str  # None, Required
    scope: str  # Unchanged, Changed
    confidentiality: str  # None, Low, High
    integrity: str  # None, Low, High
    availability: str  # None, Low, High
    
    def to_cvss_string(self) -> str:
        return f"CVSS:3.1/AV:{self.attack_vector[0].upper()}/" \
               f"AC:{self.attack_complexity[0].upper()}/" \
               f"PR:{self.privileges_required[0].upper()}/" \
               f"UI:{self.user_interaction[0].upper()}/S:{self.scope[0].upper()}/" \
               f"C:{self.confidentiality[0].upper()}/" \
               f"I:{self.integrity[0].upper()}/A:{self.availability[0].upper()}"

# Example: Remote code execution via network
rce_vector = CVSSVector(
    attack_vector="Network",
    attack_complexity="Low",
    privileges_required="None",
    user_interaction="None",
    scope="Unchanged",
    confidentiality="High",
    integrity="High",
    availability="High"
)
# Score: 9.8 (Critical)
```

### Prioritization Matrix

| CVSS Score | Severity | Remediation SLA |
|------------|----------|-----------------|
| 9.0 - 10.0 | Critical | 24-48 hours |
| 7.0 - 8.9 | High | 7 days |
| 4.0 - 6.9 | Medium | 30 days |
| 0.1 - 3.9 | Low | 90 days |
| 0.0 | None | Informational |

### Exploitability Assessment

```yaml
exploitability_factors:
  public_exploit:
    - "Exploit in wild (EASM)"
    - "Metasploit module available"
    - "POC code on GitHub"
    - "Active exploitation observed"
    
  ease_of_exploit:
    - "No authentication required"
    - "Default configuration vulnerable"
    - "Simple attack vector"
    - "Network-accessible"
    
  remediation_complexity:
    - "Vendor patch available"
    - "Workaround exists"
    - "Configuration change only"
    - "Code change required"
```

## Reporting Template

```markdown
# Vulnerability Assessment Report

## Executive Summary

### Overall Risk Posture
- **Critical**: X findings
- **High**: X findings
- **Medium**: X findings
- **Low**: X findings

### Key Risks
1. [Highest risk item]
2. [Second highest risk]
3. [Third highest risk]

## Scope

| Asset Type | Count | Coverage |
|------------|-------|----------|
| Servers | X | X% |
| Workstations | X | X% |
| Applications | X | X% |
| Containers | X | X% |

## Findings

### Critical Findings

| ID | Vulnerability | Affected Asset | CVSS | Remediation |
|----|--------------|----------------|------|-------------|
| C-01 | CVE-2024-XXXX | prod-web-01 | 9.8 | Patch to v2.1.0 |
| C-02 | SQL Injection | api.myapp.com | 9.1 | Input validation |

### Detailed Finding

**C-01: Remote Code Execution via CVE-XXXX**

**Description**: [What the vulnerability is]

**Evidence**:
```
$ nmap --script vuln 10.0.0.50
PORT  443  STATE SERVICE
443/tcp open  https
| http-vuln-cve2024-XXXX:
|   VULNERABLE
|   CVE-2024-XXXX: Remote code execution
```

**Impact**: Full system compromise, data exfiltration

**Remediation**:
- Immediate: Apply vendor patch v2.1.0
- Short-term: Implement WAF rules
- Long-term: Architecture review

**Verification**:
```bash
# Confirm fix
nmap --script vuln 10.0.0.50 | grep -i vulnerable
```

## Risk Acceptance

| Finding | Business Justification | Accepted By | Expiry |
|---------|----------------------|-------------|--------|
| C-02 | Legacy system, EOL planned | CISO | 2024-03-01 |

## Appendix

### Tools Used
- Nmap 7.94
- Trivy 0.50.0
- OWASP ZAP 2.14.0

### Scan Configuration
[Scanner configuration files]
```

## Continuous Monitoring

```yaml
# Scheduled vulnerability scanning
schedule:
  critical_assets: "Weekly"
  production: "Bi-weekly"
  staging: "Monthly"
  development: "Quarterly"

integration:
  ci_cd:
    - Trivy on container builds
    - Semgrep on PRs
    - Dependency scanning
  
  monitoring:
    - New CVE alerts via RSS/email
    - Exploit-db monitoring
    - Vendor security advisories
```

## Remediation Tracking

```yaml
remediation_tracker:
  database:
    finding_id: "C-01"
    title: "Outdated OpenSSL"
    status: "in_progress"
    created: "2024-01-10"
    due_date: "2024-01-17"
    assigned: "DevOps Team"
    progress:
      - task: "Download patch"
        status: "complete"
      - task: "Test in staging"
        status: "complete"
      - task: "Deploy to production"
        status: "in_progress"
      - task: "Verify fix"
        status: "pending"
```

## Third-Party Risk Assessment

```bash
# Check for vulnerable dependencies
pip-audit --format=json --output=pip-vulns.json
npm audit --json > npm-vulns.json
bundle-audit --format=json --output=bundler-vulns.json

# Check third-party services
curl -s "https://owasp.org/www-project-dependency-check/" | grep -i vulnerability

# SBOM generation and scanning
syft myapp:latest -o cyclonedx-json --file sbom.json
grype sbom:sbom.json --output json
```

## Tools Reference

| Category | Tool | Use Case |
|----------|------|----------|
| Network | Nmap | Host discovery, port scanning |
| Network | Masscan | Fast port scanning |
| Web | OWASP ZAP | Web app testing |
| Web | Burp Suite | Manual testing |
| Web | SQLMap | SQL injection |
| Container | Trivy | Image scanning |
| Container | Grype | Image scanning |
| Code | Semgrep | SAST |
| Code | CodeQL | SAST |
| Dependencies | OWASP Dependency-Check | CVE lookup |
| Infrastructure | ScoutSuite | Cloud security |
| Infrastructure | Prowler | AWS security |
```
