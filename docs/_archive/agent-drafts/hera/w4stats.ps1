$files = @(
    @{L='T-HE-032_CANONICAL_MAIN'; F='C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hera\T-HE-032_codif_26_4_pattern_d_evolution_v0.1.md'},
    @{L='T-HE-032_SLOT_MAIN'; F='C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-586bb235\fpa\docs\drafts\hera\T-HE-032_codif_26_4_pattern_d_evolution_v0.1.md'},
    @{L='T-HE-032_SIDECAR_CANONICAL'; F='C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hera\T-HE-032_codif_26_4_pattern_d_evolution_v0.1.w4.json'},
    @{L='T-HE-032_SIDECAR_SLOT'; F='C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-586bb235\fpa\docs\drafts\hera\T-HE-032_codif_26_4_pattern_d_evolution_v0.1.w4.json'},
    @{L='T-HE-039_CANONICAL_MAIN'; F='C:\Users\Tahir\Desktop\frontend that i want\fpa\docs\drafts\hera\T-HE-039_w6_apply_to_T-HE-032_v0.1.1_v0.1.md'},
    @{L='T-HE-039_SLOT_MAIN'; F='C:\Users\Tahir\AppData\Roaming\AionUi\aionui\conversations\aionrs-temp-586bb235\fpa\docs\drafts\hera\T-HE-039_w6_apply_to_T-HE-032_v0.1.1_v0.1.md'}
)

$out = @()
foreach ($entry in $files) {
    if (Test-Path $entry.F) {
        $c = Get-Content $entry.F -Raw
        $b = [System.Text.Encoding]::UTF8.GetBytes($c)
        $bc = $b.Length
        $lfCount = ([regex]::Matches($c, "`n")).Count
        $nb = (Get-Content $entry.F | Where-Object { $_ -ne '' }).Count
        $sha = [System.Security.Cryptography.SHA256]::Create().ComputeHash($b)
        $hashHex = -join ($sha | ForEach-Object { $_.ToString('x2') })
        $out += "$($entry.L) | LF=$lfCount | BC=$bc | NB=$nb | SHA=$hashHex"
    } else {
        $out += "$($entry.L) | NOT_FOUND"
    }
}
$out -join "`n" | Out-File -FilePath 'C:\Users\Tahir\AppData\Local\Temp\w4stats.txt' -Encoding utf8 -NoNewline
