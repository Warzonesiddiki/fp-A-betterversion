---
name: cron-job-management
description: Cron job scheduling and management including crontab syntax, system crons, systemd timers, and monitoring scheduled tasks.
origin: https://en.wikipedia.org/wiki/Cron
---

# Cron Job Management

## Crontab Syntax

### Format
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * * command
```

### Examples
```bash
# Every minute
* * * * * /scripts/monitor.sh

# Every 5 minutes
*/5 * * * * /scripts/check.sh

# Every hour at minute 30
30 * * * * /scripts/hourly.sh

# Every day at midnight
0 0 * * * /scripts/daily-backup.sh

# Every Monday at 9 AM
0 9 * * 1 /scripts/weekly-report.sh

# First day of every month at 6 AM
0 6 1 * * /scripts/monthly-task.sh

# Every 15 minutes during business hours
*/15 9-17 * * 1-5 /scripts/business-hours.sh

# Twice a day (9 AM and 5 PM)
0 9,17 * * * /scripts/twice-daily.sh

# Run on specific dates (Jan 1 and Jul 1)
0 0 1 1,7 * /scripts/holiday-task.sh
```

## Managing Crontab

### Commands
```bash
# Edit current user's crontab
crontab -e

# List current user's crontab
crontab -l

# Remove current user's crontab
crontab -r

# Edit another user's crontab
sudo crontab -e -u username
sudo crontab -l -u username

# Import crontab from file
crontab file.txt
```

### Environment Variables
```bash
# In crontab file
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=admin@example.com
HOME=/root

0 * * * * /scripts/hourly-task.sh
```

## System Cron

### Directories
```bash
# /etc/cron.d/          - System-wide cron jobs
# /etc/cron.daily/      - Daily tasks
# /etc/cron.hourly/     - Hourly tasks
# /etc/cron.weekly/     - Weekly tasks
# /etc/cron.monthly/    - Monthly tasks
```

### System Cron File Format
```bash
# /etc/cron.d/backup-job
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Run as root, log output
0 2 * * * root /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

## Systemd Timers (Modern Alternative)

### Timer Unit
```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup service daily at 2 AM
Requires=backup.service

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Service Unit
```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Backup Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
User=backup
Nice=10

[Install]
WantedBy=multi-user.target
```

### Timer Commands
```bash
# Enable and start timer
systemctl enable --now backup.timer

# List active timers
systemctl list-timers
systemctl list-timers --all

# Manual trigger
systemctl start backup.service

# Check status
systemctl status backup.timer
journalctl -u backup.service
```

## Logging and Monitoring

### Cron Output
```bash
# Redirect all output to syslog
0 * * * * /scripts/task.sh 2>&1 | logger -t mytask

# Send email on error only
0 * * * * /scripts/task.sh 2>&1

# Log with timestamp
0 * * * * /scripts/task.sh >> /var/log/task.log 2>&1
```

### Monitoring Cron
```bash
# Check cron logs (Debian/Ubuntu)
grep CRON /var/log/syslog

# Check cron logs (RHEL/CentOS)
grep CRON /var/log/cron

# Watch cron log in real-time
tail -f /var/log/syslog | grep CRON
```

## Best Practices

### Script Requirements
```bash
#!/bin/bash
# Always use full paths in scripts
set -euo pipefail
cd /app || exit 1

# Log everything
exec > >(logger -t backup -s) 2>&1

echo "Starting backup at $(date)"
```

### Error Handling
```bash
#!/bin/bash
set -euo pipefail

# Exit on any error with notification
trap 'echo "Backup failed at $(date)" | mail -s "Cron Error" admin@example.com' ERR

# Timeout for long-running jobs
timeout 3600 /scripts/backup.sh || { echo "Backup timed out"; exit 1; }
```

### Environment Isolation
```bash
# Load proper environment in scripts
#!/bin/bash
source /etc/profile
source ~/.bashrc
export PATH="/usr/local/bin:$PATH"

# Or source specific env file
if [ -f /app/.env ]; then
    source /app/.env
fi
```

## Anacron (For Non-Always-On Systems)

### Configuration
```bash
# /etc/anacrontab
# format: period delay job-identifier command
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Run daily with 5 minute delay after boot
1 5 daily-tasks /usr/local/bin/daily-tasks.sh

# Run weekly with 10 minute delay
7 10 weekly-tasks /usr/local/bin/weekly-tasks.sh
```

## Troubleshooting

### Common Issues
```bash
# 1. PATH issues - use absolute paths
0 * * * * /usr/bin/python3 /opt/scripts/task.py

# 2. Missing environment - source profile
0 * * * * source /etc/profile; /opt/scripts/task.sh

# 3. Permission denied - check ownership
ls -la /scripts/
chmod +x /scripts/task.sh

# 4. Wrong shell - specify shell
0 * * * * /bin/bash /scripts/task.sh

# 5. Special characters - escape properly
0 * * * * /scripts/task.sh arg1 "hello world"
```

### Debug Cron
```bash
# Test script manually first
./scripts/task.sh

# Run with verbose output
bash -x /scripts/task.sh

# Add debugging to crontab
0 * * * * bash -x /scripts/task.sh >> /tmp/debug.log 2>&1
```

## Best Practices

1. **Use absolute paths**: Cron has minimal PATH
2. **Set environment**: Don't assume environment variables
3. **Handle errors**: Exit codes and logging
4. **Avoid overlaps**: Use lock files or flock
5. **Test manually**: Before adding to cron
6. **Monitor executions**: Check logs regularly
7. **Document jobs**: Comment why each job exists
8. **Use systemd timers**: Modern alternative with better logging
