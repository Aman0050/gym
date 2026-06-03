@echo off
REM ================================================================
REM  GYM Load Test — Full Suite Runner (Windows)
REM  Runs all 3 scenarios + aggregates results
REM ================================================================

echo.
echo ============================================================
echo   GYM Management System - Load ^& Stress Testing Suite
echo ============================================================
echo.

REM Create results directory
if not exist "%~dp0results" mkdir "%~dp0results"

REM Check for k6
where k6 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] k6 is not installed.
    echo   Install with:  winget install Grafana.k6
    echo   Or:  choco install k6
    exit /b 1
)

REM Environment variables (override these or set in your shell)
if "%BASE_URL%"=="" set BASE_URL=http://localhost:5000
if "%JWT_TOKEN%"=="" set JWT_TOKEN=YOUR_TEST_JWT_TOKEN_HERE
if "%TEST_EMAIL%"=="" set TEST_EMAIL=admin@testgym.com
if "%TEST_PASSWORD%"=="" set TEST_PASSWORD=TestPass123!

echo [INFO] Target:    %BASE_URL%
echo [INFO] Auth:      %TEST_EMAIL%
echo.

REM ── Scenario 1: 100 Users ──────────────────────────────────────
echo [1/3] Running 100-user baseline load test...
echo -----------------------------------------------------------
k6 run --out json="%~dp0results\raw_100.json" "%~dp0k6\scenarios\100_users.js"
echo.

REM ── Scenario 2: 500 Users ──────────────────────────────────────
echo [2/3] Running 500-user stress test...
echo -----------------------------------------------------------
k6 run --out json="%~dp0results\raw_500.json" "%~dp0k6\scenarios\500_users.js"
echo.

REM ── Scenario 3: 1000 Users ─────────────────────────────────────
echo [3/3] Running 1000-user breaking point test...
echo -----------------------------------------------------------
k6 run --out json="%~dp0results\raw_1000.json" "%~dp0k6\scenarios\1000_users.js"
echo.

REM ── Aggregate Results ──────────────────────────────────────────
echo ============================================================
echo   Aggregating Scores...
echo ============================================================
node "%~dp0aggregate_scores.js"

echo.
echo ============================================================
echo   ALL TESTS COMPLETE — Results in: load-tests\results\
echo ============================================================
echo.
pause
