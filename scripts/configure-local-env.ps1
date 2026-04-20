Param(
  [string]$DbUser = "postgres",
  [string]$DbPassword = "postgres",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbName = "campuslab",
  [string]$RedisHost = "localhost",
  [int]$RedisPort = 6379,
  [switch]$DemoAuth,
  [switch]$OverwriteDatabaseUrl
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$apiEnvPath = Join-Path $repoRoot "services\api\.env"
$adminEnvPath = Join-Path $repoRoot "apps\admin\.env"

function Set-Or-AddEnvValue([string]$Path, [string]$Key, [string]$Value) {
  $content = if (Test-Path $Path) { Get-Content -Path $Path -Raw } else { "" }
  $escapedKey = [Regex]::Escape($Key)
  $pattern = "(?m)^$escapedKey=.*$"
  $line = "$Key=$Value"

  if ($content -match $pattern) {
    $updated = [Regex]::Replace($content, $pattern, $line)
  } else {
    if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) {
      $content += "`r`n"
    }
    $updated = $content + $line + "`r`n"
  }

  Set-Content -Path $Path -Value $updated
}

$databaseUrl = "postgresql://${DbUser}:${DbPassword}@${DbHost}:${DbPort}/${DbName}"
$redisUrl = "redis://${RedisHost}:${RedisPort}"

Write-Host "Configuring local env files..." -ForegroundColor Cyan

$existingDatabaseUrl = ""
if (Test-Path $apiEnvPath) {
  $existingLine = (Get-Content -Path $apiEnvPath | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1)
  if ($existingLine) {
    $existingDatabaseUrl = $existingLine.Substring("DATABASE_URL=".Length)
  }
}

if ($OverwriteDatabaseUrl -or -not $existingDatabaseUrl) {
  Set-Or-AddEnvValue -Path $apiEnvPath -Key "DATABASE_URL" -Value $databaseUrl
} else {
  Write-Host "Keeping existing DATABASE_URL from services/api/.env" -ForegroundColor Yellow
}
Set-Or-AddEnvValue -Path $apiEnvPath -Key "REDIS_URL" -Value $redisUrl
Set-Or-AddEnvValue -Path $apiEnvPath -Key "APP_ORIGIN" -Value "http://localhost:5173"

if ($DemoAuth) {
  Set-Or-AddEnvValue -Path $apiEnvPath -Key "ADMIN_SHOWCASE_LOGIN" -Value "true"
  Set-Or-AddEnvValue -Path $apiEnvPath -Key "ADMIN_OFFLINE_LOGIN" -Value "true"
} else {
  Set-Or-AddEnvValue -Path $apiEnvPath -Key "ADMIN_SHOWCASE_LOGIN" -Value "false"
  Set-Or-AddEnvValue -Path $apiEnvPath -Key "ADMIN_OFFLINE_LOGIN" -Value "false"
}

Set-Or-AddEnvValue -Path $adminEnvPath -Key "VITE_API_BASE_URL" -Value "http://localhost:4000/api/v1"

Write-Host "Updated services/api/.env and apps/admin/.env" -ForegroundColor Green
if ($OverwriteDatabaseUrl -or -not $existingDatabaseUrl) {
  Write-Host "DATABASE_URL=$databaseUrl"
} else {
  Write-Host "DATABASE_URL=$existingDatabaseUrl"
}
Write-Host "REDIS_URL=$redisUrl"
