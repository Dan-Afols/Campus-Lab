Param(
  [string]$PgBinDir = "",
  [string]$DataDir = "",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
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

Write-Host "== PostgreSQL local bootstrap ==" -ForegroundColor Cyan

if (Test-Port -HostName $DbHost -Port $DbPort) {
  Write-Host "PostgreSQL already reachable at ${DbHost}:${DbPort}" -ForegroundColor Green
  exit 0
}

$pgService = Get-Service | Where-Object { $_.Name -match "postgres" -or $_.DisplayName -match "Postgre" } | Select-Object -First 1
if ($pgService) {
  if ($pgService.Status -ne "Running") {
    Write-Host "Starting PostgreSQL service $($pgService.Name)..."
    Start-Service -Name $pgService.Name
  }
  Start-Sleep -Seconds 2
}

if (Test-Port -HostName $DbHost -Port $DbPort) {
  Write-Host "PostgreSQL reachable after service start" -ForegroundColor Green
  exit 0
}

throw "PostgreSQL is installed but not reachable at ${DbHost}:${DbPort}. Check Windows Services and PostgreSQL logs."
