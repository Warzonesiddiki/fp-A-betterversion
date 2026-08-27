# Merge classifier verdicts -> manifest + tier lists.
# Re-runnable: always rebuilds outputs from by-first-repo/*.json.
$ErrorActionPreference = 'Stop'
$ws   = 'C:\Users\Tahir\Documents\GitHub\fp-A-betterversion'
$vdir = "$ws\.market-acquire\verdicts\by-first-repo"
$out  = "$ws\.market-acquire"

$all = @{}
foreach ($f in Get-ChildItem $vdir -Filter *.json) {
  $j = Get-Content $f.FullName -Raw | ConvertFrom-Json
  foreach ($e in $j) {
    $key = $e.repo.ToLower()
    if (-not $all.ContainsKey($key)) { $all[$key] = $e }
  }
}
"merged unique verdicts: $($all.Count)"
$keeps = @($all.Values | Where-Object { $_.v -eq 'KEEP' })
$skips = @($all.Values | Where-Object { $_.v -ne 'KEEP' })
"KEEP: $($keeps.Count)  SKIP: $($skips.Count)"

# Full manifest (every judged repo)
$manifest = $all.Values | Sort-Object repo
$manifest | ConvertTo-Json -Depth 4 | Set-Content "$out\manifest-all.json" -Encoding UTF8

# Tier 2: every KEEP, install-ready command list
$keeps | ForEach-Object { "dsh plugin --profile web add github:$($_.repo)" } |
  Set-Content "$out\tier2-all-keep-commands.txt" -Encoding UTF8

# Trusted authors preferred when capping families
$trusted = @('zoahdev','johnxu22786','stardustlc666','perrylink','aks1st','leemancheung',
             'jesse-njx','michengai','tancheng33','wode25500','omdsh-dev','nanmicoder',
             'geekricardo','hellosky983','tuogusa','letter2025','lesliewylie','chouyong')

# Canonicalize the classifiers' free-form family slugs into coarse buckets,
# then cap each bucket at N installs (trusted authors win ties).
function Canon([string]$c, [string]$repo) {
  $x = "$c $repo".ToLower()
  if ($x -match 'memory|recall|engram|-kb$|knowledge|rag|note|scratchpad|sticky|annotat|distill|obsidian|flomo|notion|trilium|memos|zotero|lorebook') { 'memory-notes' }
  elseif ($x -match 'git|github|worktree|fork|branch|commit|pr-tool|revdiff') { 'git-github' }
  elseif ($x -match 'search|research|crawl|fetch|scrape|rss|wiki|scholar|pubmed|read-url|deep-read|deepread|cite|web-archive|news|paper|summar') { 'search-research' }
  elseif ($x -match 'browser|computer-use|computer|midscene|chrome|playwright|cdp|tabbit|gui-agent|cloak') { 'browser-computer' }
  elseif ($x -match 'vision|screenshot|ocr|multimodal|mm-vision|mm-vision|eyes|screen|draw2code|video-understand|picturereader|image-vision|image-input') { 'vision-ocr' }
  elseif ($x -match 'imagegen|image-gen|image-create|image-search|remotion|ffmpeg|media|video-gen|draw-router|muapi|wavespeed|grok2api') { 'media-gen' }
  elseif ($x -match 'tts|voice|speech|stt|audio|speak|ears|mic-') { 'voice' }
  elseif ($x -match '\bsql\b|database|sqlite|mysql|postgres|data-agent') { 'db' }
  elseif ($x -match 'doc|markdown|md-preview|md-notes|\bpdf|office|excel|ppt|latex|overleaf|csv|diagram|drawio|llms-forge|readme|docgen|toc|arch-doc') { 'docs-office' }
  elseif ($x -match 'notif|notify|push|ding|chime|bell|alert|feishu|lark|telegram|slack|discord|email|sms|serverchan|bark|msg-hub|im-bridge|wecom|call-me|meeting|unread') { 'notify' }
  elseif ($x -match 'cron|schedul|routin|automation|timer|heartbeat|keepalive|sleep-send|period-report') { 'schedule-automation' }
  elseif ($x -match 'session|conversation|composer|turn-nav|turn-rewind|checkpoint|rewind|undo|rollback|savepoint|handoff|claude-move|archive|draft|recover|replay|timeline|outline|navigator|convmap|density|titler|session-pin|session-tag|hotkeys|what-changed') { 'session-mgmt' }
  elseif ($x -match 'plugin|market|store|skill|extension|hub|toggle|unplug|vetting|judge|doctor|clinic|scout|subhub|mall|template|workbench|foundry|forge|framework|hooks|injector') { 'plugin-skill-mgmt' }
  elseif ($x -match '\bmcp\b') { 'mcp' }
  elseif ($x -match 'security|guard|protect|shield|defend|sentinel|approval|gate|permission|perm-|auth|secret|vault|taint|poison|injection|redact|privacy|risk|safe|egress|spill|write-gate|change-budget|scope') { 'security-safety' }
  elseif ($x -match 'review|verif|proof|doublecheck|audit|score|quality|test|k6|windtunnel|eval|flake|lint|smell|pain-point|cot-lint|reference-checker|requirement|alignment|repro') { 'quality-testing' }
  elseif ($x -match 'cost|token|usage|quota|balance|billing|spend|budget|meter|heatmap|headroom|cache-miss|rate-limit|peak') { 'cost-usage' }
  elseif ($x -match 'model|router|routing|failover|fallback|retry|gateway|provider|oauth|subscription|pool|key-pool|api-key|llm-|copilot|ollama|grok|longcat|openrouter|newapi|sub2api|capabilities|catalog|picker') { 'model-routing' }
  elseif ($x -match 'orchestr|swarm|crew|team|fleet|conductor|pilot|autopilot|loop|workflow|canvas|dag|task-planner|task-runner|queue|delegation|sidechain|mesh|interconnect|a2a|acp|protocol-bridge|codex|claude-cli|kirigaya|task-passport|task-relay|taskswarm|hermes|collab|agency|directive|director') { 'agent-orchestration' }
  elseif ($x -match 'remote|lan|tunnel|webbridge|ssh|winrm|tmux|daemon|terminal|console|wsl|win32|bash-on-windows|win-gitbash|adb|harmonyos|hdc|device|desktop-shortcut|tray') { 'remote-infra' }
  elseif ($x -match 'i18n|translate|language|chinese|linebreak|mojibake|encoding|sanitizer|polyglot|zh-cn|zh-labels') { 'i18n-text' }
  elseif ($x -match 'input|paste|clipboard|snippet|quickinput|word-complete|autocomplete|mention|at-file|keyboard-history|prompt-history|enter-customizer|deeplink|selection') { 'input-utils' }
  elseif ($x -match 'upload|download|drop|share|airdrop|qrcode|transfer|storage|\bcos\b|s3|backup|snapshot|cloud-sync|picgo|attachment|file-transfer|file-share|local-share|whitefirer') { 'file-transfer' }
  elseif ($x -match 'context|compact|prun|pack|assembler|doctor|vista|traffic|anxiety|minimal-first-turn|toolshrink|headroom') { 'context-opt' }
  elseif ($x -match 'workspace|folder|explorer|file-viewer|navigation|dock|launcher|quick-open|palette|bookmark|shelf|pathlink|quickref|project|repo-setup|starter|onboarding|genome|codegraph|code-intel|folder-tree|elohia|multi-folder|linked-folders|index|dseyes') { 'workspace-nav' }
  elseif ($x -match 'prompt') { 'prompt-enhance' }
  elseif ($x -match 'observab|trace|inspect|lens|stats|metrics|analytics|insight|timesheet|call-trace|tool-call|disyli') { 'observability' }
  elseif ($x -match 'config|rules|settings|profile|preset|env|bootstrap|network-settings|net-proxy|proxy|registry|housekeeper') { 'config-env' }
  else { 'misc' }
}

$bucketOf = @{}
foreach ($k in $keeps) { $k | Add-Member -NotePropertyName bucket -NotePropertyValue (Canon $k.c $k.repo) -Force }
$CAP = @{ 'session-mgmt' = 3; 'workspace-nav' = 3; 'quality-testing' = 3; 'plugin-skill-mgmt' = 3 }
$byFam = $keeps | Group-Object bucket | ForEach-Object {
  $maxN = if ($CAP.ContainsKey($_.Name)) { $CAP[$_.Name] } else { 2 }
  $ranked = $_.Group | Sort-Object @{e={ if ($trusted -contains ($_.repo -split '/')[0]) {0} else {1} }}, repo
  $ranked | Select-Object -First $maxN
}
$tier1 = $byFam | Sort-Object bucket, repo
"Tier-1 (bucket-capped): $($tier1.Count) across $(($keeps | Group-Object bucket).Count) buckets"
$tier1 | Group-Object bucket | Sort-Object Name | ForEach-Object { "{0,2}  {1}" -f $_.Count, $_.Name } | Set-Content "$out\tier1-buckets.txt" -Encoding UTF8
$tier1 | ConvertTo-Json -Depth 4 | Set-Content "$out\tier1-install.json" -Encoding UTF8
$tier1 | ForEach-Object { "github:$($_.repo)" } | Set-Content "$out\tier1-repos.txt" -Encoding UTF8

# Families summary
$keeps | Group-Object { $_.c } | Sort-Object Count -Descending |
  ForEach-Object { "{0,3}  {1}" -f $_.Count, $_.Name } | Set-Content "$out\families.txt" -Encoding UTF8
Get-Content "$out\families.txt" -TotalCount 40
