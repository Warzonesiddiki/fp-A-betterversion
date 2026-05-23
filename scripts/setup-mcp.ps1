# FinPlan Pro — Setup Script for Claude Code & Gemini CLI
# Run this script to install all MCP servers and link skills

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FinPlan Pro — MCP & Skills Setup      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── Claude Code MCP Setup ───────────────────────────────────────────
Write-Host "─── Claude Code MCP Servers ───" -ForegroundColor Yellow

function Add-ClaudeMcp {
    param($Name, $Command, $Args, $EnvVars)
    $envParams = @()
    if ($EnvVars) {
        foreach ($kv in $EnvVars.GetEnumerator()) {
            $envParams += "-e"
            $envParams += "$($kv.Key)=$($kv.Value)"
        }
    }
    & npx @(
        "-y", "@anthropic-ai/claude-code"
        "mcp", "add", $Name, $Command
        "--args", ($Args -join " ")
    ) @envParams 2>$null
    if ($?) { Write-Host "  ✅ MCP '$Name' configured" -ForegroundColor Green }
}

Add-ClaudeMcp -Name "github" -Command "npx" -Args @("-y", "@modelcontextprotocol/server-github") -EnvVars @{ "GITHUB_PERSONAL_ACCESS_TOKEN" = '$GITHUB_TOKEN' }
Add-ClaudeMcp -Name "git" -Command "uvx" -Args @("mcp-server-git", "--repository", ".")
Add-ClaudeMcp -Name "filesystem" -Command "npx" -Args @("-y", "@modelcontextprotocol/server-filesystem", ".")
Add-ClaudeMcp -Name "excel-analyser" -Command "npx" -Args @("-y", "excel-analyser-mcp")

# ─── Gemini CLI MCP Setup ────────────────────────────────────────────
Write-Host ""
Write-Host "─── Gemini CLI MCP Servers ───" -ForegroundColor Yellow

function Add-GeminiMcp {
    param($Name, $Command, $Args, $Env, $Transport)
    $transportFlag = if ($Transport) { @("--transport", $Transport) } else { @() }
    $envFlags = @()
    if ($Env) {
        foreach ($kv in $Env.GetEnumerator()) {
            $envFlags += "-e"
            $envFlags += "$($kv.Key)=$($kv.Value)"
        }
    }
    & gemini mcp add $Name $Command @transportFlag @envFlags "--args" ($Args -join " ") --scope project 2>$null
    if ($?) { Write-Host "  ✅ Gemini MCP '$Name' configured" -ForegroundColor Green }
}

Add-GeminiMcp -Name "github" -Command "npx" -Args @("-y", "@modelcontextprotocol/server-github") -Env @{ "GITHUB_PERSONAL_ACCESS_TOKEN" = '$GITHUB_TOKEN' }
Add-GeminiMcp -Name "git" -Command "uvx" -Args @("mcp-server-git", "--repository", ".")
Add-GeminiMcp -Name "filesystem" -Command "npx" -Args @("-y", "@modelcontextprotocol/server-filesystem", ".")
Add-GeminiMcp -Name "excel-analyser" -Command "npx" -Args @("-y", "excel-analyser-mcp")

# ─── Verify MCP Connections ──────────────────────────────────────────
Write-Host ""
Write-Host "─── Verifying MCP Connections ───" -ForegroundColor Yellow
Write-Host "Run this in Claude Code: /mcp" -ForegroundColor Gray
Write-Host "Run this in Gemini CLI: /mcp reload" -ForegroundColor Gray

# ─── Summary ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!                        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configured MCP Servers:" -ForegroundColor Green
Write-Host "  • github    — GitHub API access" -ForegroundColor White
Write-Host "  • git       — Local git operations" -ForegroundColor White
Write-Host "  • filesystem — Secure file I/O" -ForegroundColor White
Write-Host "  • excel-analyser — Excel/CSV reading" -ForegroundColor White
Write-Host ""
Write-Host "Configured Rules:" -ForegroundColor Green
Write-Host "  • .claude/rules/finplan-conventions.md" -ForegroundColor White
Write-Host "  • .claude/rules/finplan-financial.md" -ForegroundColor White
Write-Host "  • .claude/rules/finplan-accessibility.md" -ForegroundColor White
Write-Host "  • .claude/rules/finplan-testing.md" -ForegroundColor White
Write-Host "  • .claude/rules/finplan-security.md" -ForegroundColor White
Write-Host ""
Write-Host "Configured Skills:" -ForegroundColor Green
Write-Host "  • finplan-codebase — Codebase knowledge" -ForegroundColor White
Write-Host "  • finplan-data-operations — Data import/export" -ForegroundColor White
Write-Host "  • finplan-workflows — Development workflows" -ForegroundColor White
Write-Host ""
Write-Host "Gemini CLI Config:" -ForegroundColor Green
Write-Host "  • .gemini/settings.json — MCP + context + model config" -ForegroundColor White
Write-Host "  • .gemini/policies/finplan-mcp.toml — Security policies" -ForegroundColor White
Write-Host "  • GEMINI.md — Project context" -ForegroundColor White
