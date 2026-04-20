Param(
  [switch]$InstallIfMissing,
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$PgBinDir = "",
  [string]$DataDir = "$env:ProgramData\CampusLab\postgres-data"
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

function Resolve-PostgresBinDir {
  param([string]$PreferredDir)

  $candidateDirs = New-Object System.Collections.Generic.List[string]
  if ($PreferredDir) { [void]$candidateDirs.Add($PreferredDir) }
  foreach ($version in @("18", "17", "16", "15", "14", "13")) {
    [void]$candidateDirs.Add("C:\Program Files\PostgreSQL\$version\bin")
  }

  foreach ($candidate in $candidateDirs) {
    $initdb = Join-Path $candidate "initdb.exe"
    $pgCtl = Join-Path $candidate "pg_ctl.exe"
    $psql = Join-Path $candidate "psql.exe"
    $libDir = Join-Path (Split-Path -Parent $candidate) "lib"
    $dictSnowball = Join-Path $libDir "dict_snowball.dll"
    if ((Test-Path $initdb) -and (Test-Path $pgCtl) -and (Test-Path $psql) -and (Test-Path $dictSnowball)) {
      return $candidate
    }
  }

  return $null
}

Write-Host "== PostgreSQL setup ==" -ForegroundColor Cyan

if (-not $PgBinDir) {
  $PgBinDir = Resolve-PostgresBinDir -PreferredDir $null
}

if ($PgBinDir) {
  Write-Host "PostgreSQL binaries found; bootstrapping local cluster if needed..."
  & (Join-Path $PSScriptRoot "bootstrap-postgres-local.ps1") -PgBinDir $PgBinDir -DataDir $DataDir -DbHost $DbHost -DbPort $DbPort
  exit $LASTEXITCODE
}

if (Test-Port -HostName $DbHost -Port $DbPort) {
  Write-Host "PostgreSQL already reachable at ${DbHost}:${DbPort}" -ForegroundColor Green
  exit 0
}

$pgService = Get-Service | Where-Object { $_.Name -match "postgres" -or $_.DisplayName -match "Postgre" } | Select-Object -First 1
if ($pgService) {
  if ($pgService.Status -ne "Running") {
    Write-Host "Starting service $($pgService.Name)..."
    Start-Service -Name $pgService.Name
  }
  Start-Sleep -Seconds 2
  if (Test-Port -HostName $DbHost -Port $DbPort) {
    Write-Host "PostgreSQL service is running." -ForegroundColor Green
    exit 0
  }
}

if (-not $InstallIfMissing) {
  Write-Warning "PostgreSQL is not running. Re-run with -InstallIfMissing to auto-install via winget."
  exit 1
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Error "winget is not available. Install App Installer from Microsoft Store or install PostgreSQL manually."
}

Write-Host "Installing PostgreSQL 18 via winget..."
winget install -e --id PostgreSQL.PostgreSQL.18 --accept-source-agreements --accept-package-agreements --silent --override "--mode unattended --unattendedmodeui none --superpassword postgres --serverport 5432"
$pgInstallExit = $LASTEXITCODE

$PgBinDir = Resolve-PostgresBinDir -PreferredDir $null

if (-not $PgBinDir) {
  Write-Host "Trying PostgreSQL 17 as fallback..."
  winget install -e --id PostgreSQL.PostgreSQL.17 --accept-source-agreements --accept-package-agreements --silent --override "--mode unattended --unattendedmodeui none --superpassword postgres --serverport 5432"
  $pgInstallExit = $LASTEXITCODE
  $PgBinDir = Resolve-PostgresBinDir -PreferredDir $null
}

if ($PgBinDir) {
  Write-Host "PostgreSQL binaries found after install; bootstrapping local cluster..."
  & (Join-Path $PSScriptRoot "bootstrap-postgres-local.ps1") -PgBinDir $PgBinDir -DataDir $DataDir -DbHost $DbHost -DbPort $DbPort
  exit $LASTEXITCODE
}

Write-Error "PostgreSQL install failed or incomplete (exit code: $pgInstallExit). Open Services and start PostgreSQL x64 service, then ensure DATABASE_URL uses correct user/password."
