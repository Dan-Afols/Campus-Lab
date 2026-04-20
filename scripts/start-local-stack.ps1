Param(
  [switch]$InstallServices,
  [switch]$SkipNodeInstall,
  [switch]$SkipAi,
  [switch]$WithMobile,
  [switch]$WithWeb,
  [switch]$WithNgrok,
  [switch]$RunSmoke,
  [switch]$ReseedData,
  [switch]$DemoAuth,
  [switch]$OverwriteDatabaseUrl,
  [string]$NgrokUrl = "",
  [int]$ApiPort = 4000,
  [int]$NgrokApiPort = 4040,
  [string]$DbUser = "postgres",
  [string]$DbPassword = "danafols",
  [string]$DbName = "campuslab",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$RedisHost = "localhost",
  [int]$RedisPort = 6379,
  [string]$PgBinDir = "",
  [string]$DataDir = "$env:ProgramData\CampusLab\postgres-data"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiDir = Join-Path $repoRoot "services\api"
$aiDir = Join-Path $repoRoot "services\ai-server"
$adminDir = Join-Path $repoRoot "apps\admin"
$mobileDir = Join-Path $repoRoot "apps\mobile"
$webPort = 5174
$aiPort = 8001

function Write-Stage([string]$Message) {
  Write-Host "\n=== $Message ===" -ForegroundColor Cyan
}

function Assert-Port([string]$HostName, [int]$Port, [string]$Name) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect($HostName, $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(1200, $false)
    $open = $ok -and $client.Connected
    $client.Close()
    if (-not $open) {
      throw "$Name is not reachable at ${HostName}:${Port}."
    }
  } catch {
    throw "$Name is not reachable at ${HostName}:${Port}."
  }
}

function Resolve-NgrokPublicUrl([int]$ProxyPort, [int]$ApiPortToCheck) {
  $attempts = 30
  for ($i = 0; $i -lt $attempts; $i++) {
    try {
      $resp = Invoke-RestMethod -Uri "http://127.0.0.1:${ApiPortToCheck}/api/tunnels" -TimeoutSec 2
      if ($resp -and $resp.tunnels) {
        $target = $resp.tunnels | Where-Object { $_.config.addr -like "*:${ProxyPort}" -and $_.public_url -like "https://*" } | Select-Object -First 1
        if (-not $target) {
          $target = $resp.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1
        }
        if ($target -and $target.public_url) {
          return [string]$target.public_url
        }
      }
    } catch {
      # ngrok api not ready yet
    }
    Start-Sleep -Milliseconds 1000
  }
  return ""
}

function Get-LanIPv4() {
  try {
    $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object {
        $_.IPAddress -ne "127.0.0.1" -and
        $_.IPAddress -notlike "169.254.*" -and
        $_.PrefixOrigin -ne "WellKnown"
      } |
      Sort-Object InterfaceMetric |
      Select-Object -First 1 -ExpandProperty IPAddress

    return [string]$ip
  } catch {
    return ""
  }
}

Write-Stage "Campus Lab Real Local Bootstrap"

$requestedPwaNgrok = $WithWeb -and $WithNgrok
if ($requestedPwaNgrok) {
  Write-Host "PWA ngrok mode is disabled for now. Falling back to LOCAL + PWA." -ForegroundColor Yellow
  $WithNgrok = $false
}

$modeLabel = if ($WithWeb -and $WithNgrok) {
  "LOCAL + PWA + NGROK"
} elseif ($WithWeb) {
  "LOCAL + PWA"
} elseif ($WithNgrok) {
  "LOCAL + NGROK"
} else {
  "LOCAL"
}
Write-Host "Startup mode: $modeLabel" -ForegroundColor Yellow

if ($InstallServices) {
  Write-Stage "Installing PostgreSQL and Redis separately"
  & (Join-Path $PSScriptRoot "install-postgres.ps1") -InstallIfMissing -DbHost $DbHost -DbPort $DbPort -PgBinDir $PgBinDir -DataDir $DataDir
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL setup failed." }
  & (Join-Path $PSScriptRoot "install-redis.ps1") -InstallIfMissing -RedisHost $RedisHost -RedisPort $RedisPort
  if ($LASTEXITCODE -ne 0) { throw "Redis setup failed." }
} else {
  Write-Stage "Checking PostgreSQL and Redis"
  & (Join-Path $PSScriptRoot "install-postgres.ps1") -DbHost $DbHost -DbPort $DbPort -PgBinDir $PgBinDir -DataDir $DataDir
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL is required. Run npm run setup:postgres or npm run start:local:install." }
  & (Join-Path $PSScriptRoot "install-redis.ps1") -RedisHost $RedisHost -RedisPort $RedisPort
  if ($LASTEXITCODE -ne 0) { throw "Redis is required. Run npm run setup:redis or npm run start:local:install." }
}

Write-Stage "Configuring backend/admin env"
& (Join-Path $PSScriptRoot "configure-local-env.ps1") -DbUser $DbUser -DbPassword $DbPassword -DbHost $DbHost -DbPort $DbPort -DbName $DbName -RedisHost $RedisHost -RedisPort $RedisPort -DemoAuth:$DemoAuth -OverwriteDatabaseUrl:$OverwriteDatabaseUrl

Assert-Port -HostName $DbHost -Port $DbPort -Name "PostgreSQL"
Assert-Port -HostName $RedisHost -Port $RedisPort -Name "Redis"

if (-not $SkipNodeInstall) {
  Write-Stage "Installing Node dependencies"
  Set-Location $repoRoot
  npm install
}

Write-Stage "Preparing database schema"
Set-Location $apiDir
npm run prisma:generate
if ($LASTEXITCODE -ne 0) { throw "Prisma client generation failed." }
npm run prisma:push
if ($LASTEXITCODE -ne 0) { throw "Prisma schema push failed. Check PostgreSQL availability and DATABASE_URL." }

if ($ReseedData) {
  Write-Stage "Reseeding database"
  npm run seed
  if ($LASTEXITCODE -ne 0) { throw "Database seed failed." }
} else {
  Write-Host "Skipping seed to preserve existing data changes. Use -ReseedData to reset demo data." -ForegroundColor Yellow
}

Write-Stage "Starting API and Admin"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$apiDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$adminDir'; npm run dev"

if (-not $SkipAi) {
  Write-Stage "Starting AI server"
  if (Test-Path $aiDir) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$aiDir'; python -m uvicorn app.main:app --host 0.0.0.0 --port $aiPort"
  } else {
    Write-Host "services/ai-server not found. Skipping AI server startup." -ForegroundColor Yellow
  }
}

if ($WithNgrok) {
  Write-Stage "Starting ngrok tunnel"
  if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    throw "ngrok is not installed or not in PATH."
  }

  $ngrokTargetPort = if ($WithWeb) { $webPort } else { $ApiPort }

  if ($NgrokUrl) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http --url=$NgrokUrl $ngrokTargetPort"
    if (-not $WithWeb) {
      & (Join-Path $PSScriptRoot "set-mobile-api.ps1") -UseNgrok -NgrokUrl $NgrokUrl
    }
    Write-Host "Using fixed ngrok URL: $NgrokUrl" -ForegroundColor Green
  } else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ngrok http $ngrokTargetPort"
    $resolvedNgrok = Resolve-NgrokPublicUrl -ProxyPort $ngrokTargetPort -ApiPortToCheck $NgrokApiPort
    if ($resolvedNgrok) {
      if (-not $WithWeb) {
        & (Join-Path $PSScriptRoot "set-mobile-api.ps1") -UseNgrok -NgrokUrl $resolvedNgrok
      }
      Write-Host "Detected ngrok URL: $resolvedNgrok" -ForegroundColor Green
      Write-Host "Note: This URL may change if ngrok restarts without a reserved/static URL." -ForegroundColor Yellow
    } else {
      Write-Host "ngrok started, but URL detection failed. Set manually with scripts/set-mobile-api.ps1 -UseNgrok -NgrokUrl <url>." -ForegroundColor Yellow
    }
  }
}

if ($WithMobile) {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mobileDir'; npm run start"
}

if ($WithWeb) {
  $webDir = Join-Path $repoRoot "apps\web"
  if (Test-Path $webDir) {
    if ($WithNgrok) {
      # In single-tunnel mode, frontend and API share one origin. Vite proxies /api -> localhost:4000.
      & (Join-Path $PSScriptRoot "set-web-api.ps1") -ApiBaseUrl "/api/v1"
    } else {
      & (Join-Path $PSScriptRoot "set-web-api.ps1") -ApiBaseUrl "http://localhost:$ApiPort/api/v1"
    }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$webDir'; npm run dev"
  } else {
    Write-Host "apps/web not found. Skipping web startup." -ForegroundColor Yellow
  }
}

if ($RunSmoke) {
  Write-Stage "Running smoke checks"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot'; powershell -ExecutionPolicy Bypass -File .\scripts\smoke-local.ps1"
}

Write-Host "\nStack started." -ForegroundColor Green
Write-Host "Admin URL: http://localhost:5173"
Write-Host "API URL: http://localhost:$ApiPort/api/v1/health"
if (-not $SkipAi) {
  Write-Host "AI URL: http://localhost:$aiPort/api/ai/health"
}
if ($DemoAuth) {
  Write-Host "Demo auth is ON -> showcase@campuslab.app / Showcase@123!" -ForegroundColor Yellow
} else {
  Write-Host "Demo auth is OFF -> use real admin credentials from your DB." -ForegroundColor Yellow
}

if ($WithNgrok) {
  if ($NgrokUrl) {
    if ($WithWeb) {
      Write-Host "PWA via ngrok: ${NgrokUrl}" -ForegroundColor Green
      Write-Host "PWA API via same origin: ${NgrokUrl}/api/v1" -ForegroundColor Green
    } else {
      Write-Host "Mobile API (ngrok fixed): ${NgrokUrl}/api/v1" -ForegroundColor Green
    }
  } else {
    if ($WithWeb) {
      Write-Host "PWA ngrok URL was auto-detected and written to apps/web/.env as same-origin API (/api/v1)." -ForegroundColor Yellow
    } else {
      Write-Host "Mobile API was set to detected ngrok URL if discovery succeeded." -ForegroundColor Yellow
    }
  }
}

if ($WithWeb) {
  Write-Host "PWA URL: http://localhost:5174" -ForegroundColor Green
  $lanIp = Get-LanIPv4
  if ($lanIp) {
    Write-Host "PWA URL (Wi-Fi/LAN): http://${lanIp}:5174" -ForegroundColor Green
    Write-Host "API URL (Wi-Fi/LAN): http://${lanIp}:${ApiPort}/api/v1" -ForegroundColor Green
  } else {
    Write-Host "LAN IP not detected automatically. Use ipconfig and open http://<LAN_IP>:5174 on your phone." -ForegroundColor Yellow
  }
  if ($WithNgrok) {
    Write-Host "PWA API mode: same-origin proxy (/api/v1 -> localhost:$ApiPort)" -ForegroundColor Green
  } else {
    Write-Host "PWA API mode: direct local API (http://localhost:$ApiPort/api/v1)" -ForegroundColor Green
  }
}
