Param(
  [string]$ApiBaseUrl = "",
  [switch]$UseLanIp,
  [switch]$UseNgrok,
  [string]$NgrokUrl = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$webEnvPath = Join-Path $repoRoot "apps\web\.env"

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

$resolvedBase = $ApiBaseUrl

if ($UseNgrok) {
  if (-not $NgrokUrl) {
    throw "Provide -NgrokUrl when using -UseNgrok (example: https://xxxx.ngrok-free.app)"
  }
  $resolvedBase = "$NgrokUrl/api/v1"
}

if ($UseLanIp) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -ne "WellKnown"
  } | Select-Object -First 1 -ExpandProperty IPAddress)

  if (-not $ip) {
    throw "Could not auto-detect LAN IP"
  }

  $resolvedBase = "http://${ip}:4000/api/v1"
}

if (-not $resolvedBase) {
  $resolvedBase = "http://localhost:4000/api/v1"
}

Set-Or-AddEnvValue -Path $webEnvPath -Key "VITE_API_BASE_URL" -Value $resolvedBase
Write-Host "Updated apps/web/.env" -ForegroundColor Green
Write-Host "VITE_API_BASE_URL=$resolvedBase"