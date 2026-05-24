---
name: terminal-productivity
description: Terminal productivity including tmux/screen sessions, aliases, keybindings, prompt customization, and workflow optimization.
origin: https://github.com/tmux/tmux/wiki
---

# Terminal Productivity

## tmux - Terminal Multiplexer

### Sessions and Windows
```bash
# Start new session
tmux new -s mysession

# Detach from session (prefix: Ctrl-b)
# Press Ctrl-b then d

# List sessions
tmux ls

# Attach to session
tmux attach -t mysession
tmux attach  # attach to last session

# Kill session
tmux kill-session -t mysession
```

### Panes
```bash
# Split horizontally (prefix + %)
Ctrl-b %

# Split vertically (prefix + ")
Ctrl-b "

# Navigate panes
Ctrl-b <arrow key>

# Resize pane
Ctrl-b :resize-pane -D 10  # down 10 lines
Ctrl-b :resize-pane -U 5   # up 5 lines

# Close pane
Ctrl-b x
```

### Window Management
```bash
# Create window (prefix + c)
Ctrl-b c

# Switch windows (prefix + 0-9)
Ctrl-b 0  # window 0
Ctrl-b 1  # window 1

# Next/previous window
Ctrl-b n  # next
Ctrl-b p  # previous

# List windows (prefix + w)
Ctrl-b w
```

### tmux Configuration
```bash
# ~/.tmux.conf
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Enable mouse
set -g mouse on

# Start window index at 1
set -g base-index 1
setw -g pane-base-index 1

# Vim keybindings
setw -g mode-keys vi
bind -r h select-pane -L
bind -r j select-pane -D
bind -r k select-pane -U
bind -r l select-pane -R
```

## Aliases and Functions

### Bash Aliases
```bash
# ~/.bash_aliases
alias ll='ls -lah'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'

# Safety aliases
alias rm='rm -i'
alias cp='cp -i'
alias mv='mv -i'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph --decorate --all'
alias gd='git diff'
alias gco='git checkout'
alias gb='git branch'

# Docker aliases
alias dps='docker ps'
alias di='docker images'
alias dex='docker exec -it'
alias dlogs='docker logs -f'
```

### Bash Functions
```bash
# Quick directory navigation
cdl() { cd "$@" && ls -la; }

# Extract archives
extract() {
    if [ -f "$1" ]; then
        case "$1" in
            *.tar.bz2) tar xjf "$1" ;;
            *.tar.gz) tar xzf "$1" ;;
            *.zip) unzip "$1" ;;
            *.rar) unrar x "$1" ;;
        esac
    fi
}

# Find in files
fif() { grep -rn "$1" "${2:-.}"; }
```

## Command Line Tips

### History
```bash
# Execute last command
!!

# Execute last command starting with 'git'
!git

# Execute specific command from history
!42

# Search history
Ctrl-r

# Alternative history search
history | grep <term>

# Avoid duplicate entries
export HISTCONTROL=ignoredups:erasedups
```

### Job Control
```bash
# Background job
./long-running-script.sh &

# List jobs
jobs

# Bring to foreground
fg %1

# Send to background
Ctrl-z then bg
```

### Process Management
```bash
# Kill process by name
pkill -f process-name

# Find process
ps aux | grep process-name

# Real-time process monitor
top
htop  # if installed
```

## Custom Prompt

### Bash Prompt
```bash
# ~/.bashrc - Git-aware prompt
parse_git_branch() {
    git branch 2>/dev/null | grep '*' | sed 's/* //'
}

export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$(parse_git_branch)\$ '
```

### PowerShell Prompt
```powershell
function prompt {
    $location = Get-Location
    $gitStatus = git branch 2>$null | Where-Object { $_.StartsWith("*") }
    
    Write-Host "$env:USERNAME@" -NoNewline -ForegroundColor Green
    Write-Host "$env:COMPUTERNAME" -NoNewline -ForegroundColor Cyan
    Write-Host ":$location" -NoNewline -ForegroundColor Blue
    
    if ($gitStatus) {
        Write-Host " ($gitStatus)" -NoNewline -ForegroundColor Yellow
    }
    
    Write-Host "> " -NoNewline
    return ""
}
```

## Useful Shortcuts

### Bash Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+a | Beginning of line |
| Ctrl+e | End of line |
| Ctrl+u | Clear line before cursor |
| Ctrl+k | Clear line after cursor |
| Ctrl+w | Delete word before cursor |
| Alt+d | Delete word after cursor |
| Ctrl+r | Search history |
| Ctrl+l | Clear screen |
| Ctrl+c | Cancel current command |
| Ctrl+z | Suspend process |

### Vim Mode (optional)
```bash
# Enable in ~/.bashrc
set -o vi
```
- `Esc` to enter command mode
- `/` to search forward
- `n` for next match
- `0` start of line, `$` end of line
- `w` next word, `b` previous word

## Workflow Patterns

### tmux Workflow
```bash
# Layout: Development
tmux new-session -s dev -n editor
tmux send-keys 'vim' C-m
tmux split-window -v
tmux send-keys 'npm test -- --watch' C-m
tmux split-window -h
tmux send-keys 'git log --oneline -20' C-m
```

### SSH + tmux
```bash
# SSH and attach to session
ssh -t user@host "tmux attach -t mysession || tmux new -s mysession"
```

## Best Practices

1. **Use tmux/screen**: Never lose work if terminal closes
2. **Learn keyboard shortcuts**: Avoid repetitive typing
3. **Create aliases**: Automate frequent commands
4. **Configure your prompt**: Show useful context (git, k8s, etc.)
5. **Use persistent history**: Search old commands easily
6. **Split panes**: Keep multiple views visible
7. **Name sessions**: Easy to find and attach later
8. **Customize colors**: Reduce eye strain, improve readability
