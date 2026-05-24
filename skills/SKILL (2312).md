---
name: shell-scripting
description: Shell scripting for bash and PowerShell including syntax, functions, error handling, common utilities, and automation patterns.
origin: https://www.gnu.org/software/bash/manual/
---

# Shell Scripting

## Bash Fundamentals

### Shebang and Basics
```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Comments
# This is a comment

# Variables
NAME="World"
echo "Hello, $NAME!"
echo "Hello, ${NAME}!"
```

### Conditionals
```bash
# File conditions
if [ -f "file.txt" ]; then
    echo "File exists"
elif [ -d "dir" ]; then
    echo "Directory exists"
else
    echo "Not found"
fi

# String conditions
if [ "$NAME" = "admin" ]; then
    echo "Welcome, admin"
fi

if [ -z "$VAR" ]; then
    echo "Variable is empty"
fi

# Numeric comparison
if [ "$COUNT" -gt 10 ]; then
    echo "Count is greater than 10"
fi
```

### Loops
```bash
# For loop
for i in {1..5}; do
    echo "Number: $i"
done

# For with files
for file in *.txt; do
    echo "Processing: $file"
done

# While loop
count=1
while [ $count -le 10 ]; do
    echo "Count: $count"
    ((count++))
done

# Read file line by line
while IFS= read -r line; do
    echo "Line: $line"
done < file.txt
```

## Functions

### Bash Functions
```bash
function greet() {
    local name="$1"
    echo "Hello, $name!"
}

function get_sum() {
    local a=$1
    local b=$2
    echo $((a + b))
}

# Call function
greet "World"
result=$(get_sum 5 10)
echo "Sum: $result"
```

## PowerShell Fundamentals

### Basics
```powershell
# Variables
$name = "World"
Write-Host "Hello, $name"

# Data types
[string]$str = "text"
[int]$num = 42
[array]$arr = @(1, 2, 3)
[hashtable]$hash = @{ key = "value" }

# Cmdlets
Get-ChildItem
Get-Process
Get-Service
```

### Conditionals
```powershell
# If-Else
if ($age -gt 18) {
    Write-Host "Adult"
} elseif ($age -gt 12) {
    Write-Host "Teen"
} else {
    Write-Host "Child"
}

# Switch
switch ($status) {
    "active" { Write-Host "Running" }
    "stopped" { Write-Host "Stopped" }
    default { Write-Host "Unknown" }
}

# Comparison operators
# -eq, -ne, -gt, -lt, -ge, -le
# -like, -match (wildcard/regex)
# -in, -contains
```

### Loops
```powershell
# ForEach-Object
1..5 | ForEach-Object {
    Write-Host "Number: $_"
}

# ForEach
foreach ($item in $collection) {
    Write-Host $item
}

# While
$i = 0
while ($i -lt 5) {
    $i++
}

# Do-While
do {
    $i++
} while ($i -lt 5)
```

### Functions
```powershell
function Get-Sum {
    param(
        [int]$A,
        [int]$B
    )
    return $A + $B
}

function Send-Notification {
    param(
        [Parameter(Mandatory)]
        [string]$Message,
        
        [string]$Priority = "Normal"
    )
    Write-Host "[$Priority] $Message"
}
```

## Error Handling

### Bash Error Handling
```bash
set -euo pipefail

# Check command success
if ./deploy.sh; then
    echo "Deploy successful"
else
    echo "Deploy failed"
    exit 1
fi

# Trap errors
trap 'echo "Error on line $LINENO"' ERR

# Capture exit code
./script.sh
exit_code=$?
```

### PowerShell Error Handling
```powershell
try {
    Get-Content "file.txt" -ErrorAction Stop
} catch {
    Write-Host "Error: $_"
} finally {
    # Cleanup
}

# Check for errors
$ErrorActionPreference = "Stop"
```

## Common Utilities

### File Operations
```bash
# Read file
content=$(cat file.txt)
while IFS= read -r line; do
    echo "$line"
done < "file.txt"

# Write file
cat > output.txt << 'EOF'
Line 1
Line 2
EOF

# Append
echo "new line" >> output.txt
```

### String Operations
```bash
# Substring
str="Hello World"
echo "${str:0:5}"  # Hello
echo "${str#*o}"    # World

# Replace
echo "${str/World/GitHub}"  # Hello GitHub

# Arrays
arr=(one two three)
echo "${arr[0]}"
echo "${arr[@]}"  # all elements
echo "${#arr[@]}" # length
```

### JSON Handling
```bash
# jq examples
cat data.json | jq '.users[] | select(.active==true)'
cat data.json | jq -r '.users[].name'

# PowerShell
$json = Get-Content "data.json" | ConvertFrom-Json
$json.users | Where-Object active | Select-Object name
```

## Scripting Patterns

### CLI Arguments
```bash
#!/usr/bin/env bash
set -euo pipefail

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            NAME="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done
```

### Logging
```bash
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}

log "INFO" "Starting process"
log "ERROR" "Something failed"
```

## Best Practices

1. **Use strict mode**: `set -euo pipefail` in bash
2. **Quote variables**: Always use `"$VAR"` not bare `$VAR`
3. **Check exit codes**: Don't assume commands succeed
4. **Use functions**: Modularize code for reusability
5. **Add comments**: Explain non-obvious logic
6. **Test thoroughly**: Especially edge cases
7. **Use shellcheck**: Lint your bash scripts
8. **Cross-platform**: Test on target systems
