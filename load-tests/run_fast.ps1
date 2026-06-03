# GYM Management System - Automated Load & Stress Testing Runner

Write-Host "============================================================"
Write-Host "   GYM Management System - Load & Stress Testing Orchestrator"
Write-Host "============================================================"

# 1. Create results directory if it doesn't exist
$resultsDir = Join-Path $PSScriptRoot "results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

# 2. Find Node.js Server Process PID
Write-Host "[INFO] Finding server PID on port 5000..."
$netstatOut = netstat -ano | findstr :5000 | findstr LISTENING
if (-not $netstatOut) {
    Write-Error "Backend server is not running on port 5000! Please start the server first."
    Exit 1
}
# Split and get the PID (last item)
$serverPid = ($netstatOut.Trim() -split '\s+')[-1]
Write-Host "[SUCCESS] Found server running with PID: $serverPid"

# 3. Generate Valid JWT Token for Authentication
Write-Host "[INFO] Generating valid JWT token for test requests..."
$jwtToken = node generate_token.js

if (-not $jwtToken) {
    Write-Error "Failed to generate JWT Token."
    Exit 1
}
$jwtToken = $jwtToken.Trim()
Write-Host "[SUCCESS] JWT Token generated successfully."

# 4. Set Environment Variables for k6
$env:BASE_URL = "http://localhost:5000"
$env:JWT_TOKEN = $jwtToken
$env:TEST_EMAIL = "admin@ironparadise.com"
$env:TEST_PASSWORD = "admin123"

# 5. Start Performance Monitor
Write-Host "[INFO] Starting performance monitor..."
$csvPath = Join-Path $resultsDir "resource_utilization.csv"
$monitorJob = Start-Job -ScriptBlock {
    param($pidVal, $outVal)
    & "$using:PSScriptRoot/monitor_perf.ps1" -ProcessId $pidVal -OutputFile $outVal
} -ArgumentList $serverPid, $csvPath

# Give monitor a second to initialize
Start-Sleep -Seconds 2

# 6. Run k6 Scenarios
$k6Path = Join-Path $PSScriptRoot "bin/k6-v0.56.0-windows-amd64/k6.exe"

# Scenario 1: 100 Users
Write-Host "Running 100 Users Load Test..."
& $k6Path run --out json="results/raw_100.json" k6/scenarios/100_users.js

# Scenario 2: 500 Users
Write-Host "Running 500 Users Stress Test..."
& $k6Path run --out json="results/raw_500.json" k6/scenarios/500_users.js

# Scenario 3: 1000 Users
Write-Host "Running 1000 Users Breaking Point Test..."
& $k6Path run --out json="results/raw_1000.json" k6/scenarios/1000_users.js

# 7. Stop Performance Monitor
Write-Host "Stopping performance monitor..."
Stop-Job -Job $monitorJob | Out-Null
Remove-Job -Job $monitorJob | Out-Null

# 8. Run Master Score Aggregator
Write-Host "============================================================"
Write-Host "   Aggregating Scores & Scaling Recommendations"
Write-Host "============================================================"
node aggregate_scores.js

# 9. Read CPU and Memory Metrics from CSV
if (Test-Path $csvPath) {
    $csvData = Import-Csv -Path $csvPath
    if ($csvData) {
        # Compute CPU metrics
        $cpuList = $csvData | ForEach-Object { [double]$_.CPU_Pct }
        $avgCpu = ($cpuList | Measure-Object -Average).Average
        $maxCpu = ($cpuList | Measure-Object -Maximum).Maximum

        # Compute Memory metrics
        $memList = $csvData | ForEach-Object { [double]$_.Memory_MB }
        $avgMem = ($memList | Measure-Object -Average).Average
        $maxMem = ($memList | Measure-Object -Maximum).Maximum

        Write-Host "Server Resource Utilization Summary (During Testing):"
        Write-Host "   Average CPU Usage: $($avgCpu.ToString('F2'))% (All Cores)"
        Write-Host "   Peak CPU Usage:    $($maxCpu.ToString('F2'))%"
        Write-Host "   Average Memory:    $($avgMem.ToString('F2')) MB"
        Write-Host "   Peak Memory:       $($maxMem.ToString('F2')) MB"

        # Save stats to a JSON for the report
        $resourceStats = @{
            average_cpu_pct = [Math]::Round($avgCpu, 2)
            peak_cpu_pct    = [Math]::Round($maxCpu, 2)
            average_mem_mb  = [Math]::Round($avgMem, 2)
            peak_mem_mb     = [Math]::Round($maxMem, 2)
        }
        $resourceStats | ConvertTo-Json | Out-File -FilePath (Join-Path $resultsDir "resource_stats.json")
    }
}

Write-Host "RUN COMPLETE. Results available in load-tests/results/"
