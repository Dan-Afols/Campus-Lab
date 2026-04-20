Param(
  [switch]$InstallIfMissing,
  [string]$RedisHost = "localhost",
  [int]$RedisPort = 6379
)

$ErrorActionPreference = "Stop"

function Test-Port([string]$HostName, [int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect($HostName, $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(1200, $false)
    $open = $ok -and $client.Connected
    $client.Close()
    return $open
  } catch {
    return $false
  }
}

Write-Host "== Redis setup ==" -ForegroundColor Cyan

if (Test-Port -HostName $RedisHost -Port $RedisPort) {
  Write-Host "Redis already reachable at ${RedisHost}:${RedisPort}" -ForegroundColor Green
  exit 0
}

$redisService = Get-Service | Where-Object {
  $_.Name -match "redis|memurai" -or $_.DisplayName -match "Redis|Memurai"
} | Select-Object -First 1

if ($redisService) {
  if ($redisService.Status -ne "Running") {
    Write-Host "Starting service $($redisService.Name)..."
    Start-Service -Name $redisService.Name
  }
  Start-Sleep -Seconds 2
  if (Test-Port -HostName $RedisHost -Port $RedisPort) {
    Write-Host "Redis service is running." -ForegroundColor Green
    exit 0
  }
}

if (-not $InstallIfMissing) {
  Write-Warning "Redis is not running. Re-run with -InstallIfMissing to auto-install Memurai via winget."
  exit 1
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Error "winget is not available. Install App Installer from Microsoft Store or install Memurai/Redis manually."
}

Write-Host "Installing Memurai Developer via winget (Redis-compatible)..."
winget install -e --id Memurai.MemuraiDeveloper --accept-source-agreements --accept-package-agreements
$memuraiExit = $LASTEXITCODE

$redisService = Get-Service | Where-Object {
  $_.Name -match "redis|memurai" -or $_.DisplayName -match "Redis|Memurai"
} | Select-Object -First 1

if ($redisService -and $redisService.Status -ne "Running") {
  Start-Service -Name $redisService.Name
}

Start-Sleep -Seconds 3
if (Test-Port -HostName $RedisHost -Port $RedisPort) {
  Write-Host "Redis-compatible service installed and reachable at ${RedisHost}:${RedisPort}" -ForegroundColor Green
  exit 0
}

Write-Warning "Memurai install path did not expose ${RedisHost}:${RedisPort} (exit code: $memuraiExit). Trying Redis on Windows package..."
winget install -e --id Redis.Redis --accept-source-agreements --accept-package-agreements

$redisService = Get-Service | Where-Object {
  $_.Name -match "redis|memurai" -or $_.DisplayName -match "Redis|Memurai"
} | Select-Object -First 1

if ($redisService -and $redisService.Status -ne "Running") {
  Start-Service -Name $redisService.Name
}

Start-Sleep -Seconds 3
if (Test-Port -HostName $RedisHost -Port $RedisPort) {
  Write-Host "Redis installed via fallback package and reachable at ${RedisHost}:${RedisPort}" -ForegroundColor Green
  exit 0
}

Write-Error "Redis install failed. Check if port 6379 is already reserved and run PowerShell as Administrator."
