param(
    [int]$ProcessId,
    [string]$OutputFile
)

# Start CSV file with headers
"Time,CPU_Pct,Memory_MB" | Out-File -FilePath $OutputFile -Encoding utf8

$prevCpu = 0
$prevTime = [DateTime]::Now

# Sleep for a moment to establish base CPU time
Start-Sleep -Milliseconds 500

while ($true) {
    $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $proc) {
        Write-Output "[MONITOR] Process $ProcessId stopped. Exiting monitor."
        break
    }
    
    $cpu = $proc.CPU
    $now = [DateTime]::Now
    $elapsed = ($now - $prevTime).TotalSeconds
    
    if ($elapsed -gt 0.2) {
        $cpuDiff = $cpu - $prevCpu
        # total CPU percentage = (delta_cpu_seconds / elapsed_seconds) * 100
        # normalized for multi-core: divide by logical CPU cores
        $cpuPct = ($cpuDiff / $elapsed) * 100 / $env:NUMBER_OF_PROCESSORS
        if ($cpuPct -lt 0) { $cpuPct = 0 }
        if ($cpuPct -gt 100) { $cpuPct = 100 }
        
        $ws = $proc.WorkingSet64 / 1MB
        $timeStr = Get-Date -Format "HH:mm:ss"
        
        # Write to output file
        "$timeStr,$($cpuPct.ToString('F2')),$($ws.ToString('F2'))" | Out-File -FilePath $OutputFile -Append -Encoding utf8
        
        $prevCpu = $cpu
        $prevTime = $now
    }
    
    Start-Sleep -Seconds 1
}
