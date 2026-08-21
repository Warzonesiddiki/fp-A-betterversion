# Audit all import/export specifiers in src/** against the filesystem.
# Resolves: relative paths, @/ alias, extensionless, index.ts fallback.
$ErrorActionPreference = 'Continue'
$root = 'C:\Users\Tahir\Documents\GitHub\fp-A-betterversion'
$src = Join-Path $root 'src'

function Resolve-ModulePath {
  param([string]$spec, [string]$fromDir)
  # Returns $true if the module resolves
  if ($spec.StartsWith('@/')) {
    $base = Join-Path $src ($spec.Substring(2) -replace '/', '\')
  } elseif ($spec.StartsWith('.')) {
    $base = Join-Path $fromDir ($spec -replace '/', '\')
  } else {
    return $true # bare package import - assume node_modules
  }
  # exact file
  if (Test-Path $base) { return $true }
  foreach ($ext in @('.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts')) {
    if (Test-Path ($base + $ext)) { return $true }
  }
  # directory with index
  if (Test-Path $base) {
    if (Test-Path (Join-Path $base 'index.ts')) { return $true }
    if (Test-Path (Join-Path $base 'index.tsx')) { return $true }
    if (Test-Path (Join-Path $base 'index.js')) { return $true }
  }
  return $false
}

$files = Get-ChildItem -Recurse $src -Include *.ts, *.tsx
$broken = New-Object System.Collections.Generic.List[string]
$totalChecked = 0

foreach ($f in $files) {
  $fromDir = Split-Path $f.FullName
  $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $content) { continue }
  $matches = [regex]::Matches($content, "from\s+['`"]([^'`"]+)['`"]")
  foreach ($m in $matches) {
    $spec = $m.Groups[1].Value
    if ($spec -match '^(node:|\.css$|\.svg$|\.png$|\.jpg$|\.woff|\.ttf$|\.webp$|\.gif$|\.ico$|\.worker\.ts)') { continue }
    $totalChecked++
    if (-not (Resolve-ModulePath $spec $fromDir)) {
      $broken.Add("$($f.FullName.Replace($root + '\', '')) -> $spec")
    }
  }
}

Write-Host "Total import specifiers checked: $totalChecked"
Write-Host "BROKEN: $($broken.Count)"
$broken | Sort-Object -Unique | ForEach-Object { Write-Host "  $_" }
