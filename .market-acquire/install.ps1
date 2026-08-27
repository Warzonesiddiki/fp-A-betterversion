# Bulk-install Tier-1 repos into DSH profile 'web'. Resumable: skips repos
# already present in the profile package.json. Logs per-repo result to CSV.
$ErrorActionPreference = 'Continue'
$ws    = 'C:\Users\Tahir\Documents\GitHub\fp-A-betterversion'
$prof  = "$env:USERPROFILE\.dsh\profiles\web"
$list  = Get-Content "$ws\.market-acquire\tier1-repos.txt" | Where-Object { $_ }
$log   = "$ws\.market-acquire\install-log.csv"
New-Item -ItemType Directory -Force -Path "$ws\.market-acquire\logs" | Out-Null
"repo,status,seconds" | Set-Content $log -Encoding UTF8

$pkg = (Get-Content "$prof\package.json" -Raw | ConvertFrom-Json)
$have = @()
if ($pkg.dependencies) { $have = @($pkg.dependencies.PSObject.Properties.Name) }

$i = 0
foreach ($line in $list) {
  $repo = ($line -replace '^github:','').Trim()
  if (-not $repo) { continue }
  $i++
  $seg = ($repo -split '/')[-1].ToLower()
  $already = $have | Where-Object { $_.ToLower().Contains($seg) }
  if ($already) { "`"$repo`",`"skip-already-installed`",0" | Add-Content $log; continue }
  $t0 = Get-Date
  $lp = "$ws\.market-acquire\logs\$($seg -replace '[^a-z0-9._-]','_').log"
  & dsh plugin --profile web add "github:$repo" > $lp 2>&1
  $ok = ($LASTEXITCODE -eq 0)
  $secs = [int]((Get-Date) - $t0).TotalSeconds
  "`"$repo`",`"$(if ($ok) {'ok'} else {'FAIL'})`",$secs" | Add-Content $log
}
